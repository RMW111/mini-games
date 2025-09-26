import type { Session, SessionStatus } from "src/types/session.ts";
import type { Participant } from "src/types/participant.ts";

export enum SessionEventType {
  FullSessionState = "fullSessionState",
  GameStateUpdate = "gameStateUpdate",
  StatusUpdate = "statusUpdate",
  UserJoined = "userJoined",
}

export type SessionEvent =
  | {
      type: SessionEventType.FullSessionState;
      payload: Session;
    }
  | {
      type: SessionEventType.GameStateUpdate;
      payload: Record<string, string>;
    }
  | {
      type: SessionEventType.StatusUpdate;
      payload: SessionStatus;
    }
  | {
      type: SessionEventType.UserJoined;
      payload: { participant: Participant };
    };
