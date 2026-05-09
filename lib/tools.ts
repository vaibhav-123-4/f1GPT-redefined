import {
  getConstructorStandings,
  getDriverInfo,
  getDriverStandings,
  getLastRaceWinner,
  getNextRace,
} from "@/lib/f1api";

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "get_last_race_winner",
      description: "Get the winner and key details from the most recent Formula 1 race.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_driver_standings",
      description: "Get the current Formula 1 driver championship standings.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_driver_info",
      description: "Get factual information for a Formula 1 driver by name, surname, code, or driver ID.",
      parameters: {
        type: "object",
        properties: {
          driver: {
            type: "string",
            description: "The driver name, surname, driver code, or driver ID.",
          },
        },
        required: ["driver"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_constructor_standings",
      description: "Get the current Formula 1 constructor championship standings.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_next_race",
      description: "Get the next upcoming Formula 1 race from the current season calendar.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
] as const;

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

const toolHandlers: Record<string, ToolHandler> = {
  get_last_race_winner: async () => getLastRaceWinner(),
  get_driver_standings: async () => getDriverStandings(),
  get_driver_info: async (args) => {
    const driver = typeof args.driver === "string" ? args.driver : "";

    if (!driver) {
      throw new Error("Missing required argument: driver");
    }

    return getDriverInfo(driver);
  },
  get_constructor_standings: async () => getConstructorStandings(),
  get_next_race: async () => getNextRace(),
};

export async function executeTool(name: string, rawArguments: string | undefined) {
  const handler = toolHandlers[name];

  if (!handler) {
    throw new Error(`Unsupported tool call: ${name}`);
  }

  const parsedArguments = rawArguments ? (JSON.parse(rawArguments) as Record<string, unknown>) : {};
  const data = await handler(parsedArguments);

  return data;
}
