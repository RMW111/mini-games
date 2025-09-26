import type { SessionEvent } from "src/types/sessionEvent.ts";

export enum SocketEventType {
  Session = "session",
  Game = "game",
}

export type SocketEvent =
  | {
      type: SocketEventType.Session;
      payload: SessionEvent;
    }
  | {
      type: SocketEventType.Game;
      payload: unknown;
    };
