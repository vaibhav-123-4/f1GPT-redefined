export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: string;
}

export interface ChatResponseBody {
  message: ChatMessage;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  driverCode?: string;
  givenName: string;
  familyName: string;
  driverId: string;
  constructorNames: string[];
}

export interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  constructorId: string;
  name: string;
  nationality: string;
}

export interface DriverInfo {
  driverId: string;
  code?: string;
  permanentNumber?: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
  url?: string;
}

export interface LastRaceWinner {
  raceName: string;
  round: string;
  season: string;
  date: string;
  circuitName: string;
  locality: string;
  country: string;
  driver: {
    driverId: string;
    code?: string;
    givenName: string;
    familyName: string;
    nationality: string;
  };
  constructor: string;
  grid: string;
  laps: string;
  time?: string;
}

export interface ToolResult {
  name: string;
  data: unknown;
}

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: OpenRouterToolCall[];
}
