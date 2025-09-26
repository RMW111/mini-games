import type { Participant } from "src/types/participant.ts";

export enum SessionStatus {
  Pending = "pending",
  InProgress = "inProgress",
  Completed = "completed",
}

export interface Session<T = Record<string, string>> {
  gameState: T;
  id: string;
  participants: Participant[];
  status: SessionStatus;
}
