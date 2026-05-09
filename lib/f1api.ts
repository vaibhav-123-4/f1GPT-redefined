import {
  ConstructorStanding,
  DriverInfo,
  DriverStanding,
  LastRaceWinner,
} from "@/types";

const JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1";
const OPENF1_BASE_URL = "https://api.openf1.org/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`F1 API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeDriverId(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function getLastRaceWinner(): Promise<LastRaceWinner> {
  const payload = await fetchJson<any>(`${JOLPICA_BASE_URL}/current/last/results.json`);
  const race = payload?.MRData?.RaceTable?.Races?.[0];
  const result = race?.Results?.[0];

  if (!race || !result) {
    throw new Error("No last race result data available.");
  }

  return {
    raceName: race.raceName,
    round: race.round,
    season: race.season,
    date: race.date,
    circuitName: race.Circuit?.circuitName,
    locality: race.Circuit?.Location?.locality,
    country: race.Circuit?.Location?.country,
    driver: {
      driverId: result.Driver?.driverId,
      code: result.Driver?.code,
      givenName: result.Driver?.givenName,
      familyName: result.Driver?.familyName,
      nationality: result.Driver?.nationality,
    },
    constructor: result.Constructor?.name,
    grid: result.grid,
    laps: result.laps,
    time: result.Time?.time,
  };
}

export async function getDriverStandings(): Promise<DriverStanding[]> {
  const payload = await fetchJson<any>(`${JOLPICA_BASE_URL}/current/driverStandings.json`);
  const standings = payload?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;

  if (!Array.isArray(standings)) {
    throw new Error("No driver standings available.");
  }

  return standings.map((standing: any) => ({
    position: standing.position,
    points: standing.points,
    wins: standing.wins,
    driverCode: standing.Driver?.code,
    givenName: standing.Driver?.givenName,
    familyName: standing.Driver?.familyName,
    driverId: standing.Driver?.driverId,
    constructorNames: Array.isArray(standing.Constructors)
      ? standing.Constructors.map((constructor: any) => constructor.name)
      : [],
  }));
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
  const payload = await fetchJson<any>(`${JOLPICA_BASE_URL}/current/constructorStandings.json`);
  const standings = payload?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;

  if (!Array.isArray(standings)) {
    throw new Error("No constructor standings available.");
  }

  return standings.map((standing: any) => ({
    position: standing.position,
    points: standing.points,
    wins: standing.wins,
    constructorId: standing.Constructor?.constructorId,
    name: standing.Constructor?.name,
    nationality: standing.Constructor?.nationality,
  }));
}

export async function getDriverInfo(driverQuery: string): Promise<DriverInfo> {
  const normalizedDriverId = normalizeDriverId(driverQuery);
  const payload = await fetchJson<any>(`${JOLPICA_BASE_URL}/drivers/${normalizedDriverId}.json`);
  const driver = payload?.MRData?.DriverTable?.Drivers?.[0];

  if (driver) {
    return {
      driverId: driver.driverId,
      code: driver.code,
      permanentNumber: driver.permanentNumber,
      givenName: driver.givenName,
      familyName: driver.familyName,
      dateOfBirth: driver.dateOfBirth,
      nationality: driver.nationality,
      url: driver.url,
    };
  }

  const searchTerm = driverQuery.trim().toLowerCase();
  const currentDriversPayload = await fetchJson<any>(`${JOLPICA_BASE_URL}/current/drivers.json`);
  const currentDrivers = currentDriversPayload?.MRData?.DriverTable?.Drivers;

  if (!Array.isArray(currentDrivers)) {
    throw new Error(`No driver info found for \"${driverQuery}\".`);
  }

  const matchedDriver = currentDrivers.find((currentDriver: any) => {
    const fullName = `${currentDriver.givenName} ${currentDriver.familyName}`.toLowerCase();
    return (
      currentDriver.driverId?.toLowerCase() === searchTerm ||
      currentDriver.code?.toLowerCase() === searchTerm ||
      currentDriver.familyName?.toLowerCase() === searchTerm ||
      fullName === searchTerm
    );
  });

  if (!matchedDriver) {
    throw new Error(`No driver info found for \"${driverQuery}\".`);
  }

  return {
    driverId: matchedDriver.driverId,
    code: matchedDriver.code,
    permanentNumber: matchedDriver.permanentNumber,
    givenName: matchedDriver.givenName,
    familyName: matchedDriver.familyName,
    dateOfBirth: matchedDriver.dateOfBirth,
    nationality: matchedDriver.nationality,
    url: matchedDriver.url,
  };
}

export async function getOpenF1Health() {
  const sessions = await fetchJson<any[]>(`${OPENF1_BASE_URL}/sessions?limit=1`);
  return {
    source: "OpenF1",
    available: Array.isArray(sessions),
    sampleCount: sessions.length,
  };
}

export async function getNextRace() {
  // Jolpica provides the remaining race calendar for the current season.
  const payload = await fetchJson<any>(`${JOLPICA_BASE_URL}/current.json`);
  const races = payload?.MRData?.RaceTable?.Races;
  if (!Array.isArray(races) || races.length === 0) {
    throw new Error("No race calendar available.");
  }

  const now = new Date();
  const upcoming = races.find((race: any) => {
    const dateStr = race?.date;
    if (!dateStr) return false;
    const start = new Date(dateStr);
    // consider race upcoming if today is before or same day
    return now.getTime() <= start.getTime() + 24 * 60 * 60 * 1000;
  });

  if (!upcoming) {
    throw new Error("No upcoming race found for the current season.");
  }

  return {
    season: upcoming.season,
    round: upcoming.round,
    raceName: upcoming.raceName,
    date: upcoming.date,
    time: upcoming.time ?? null,
    circuitName: upcoming.Circuit?.circuitName,
    locality: upcoming.Circuit?.Location?.locality,
    country: upcoming.Circuit?.Location?.country,
  };
}
