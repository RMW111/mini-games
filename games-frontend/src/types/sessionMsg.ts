import type { Session, SessionStatus } from "src/types/session.ts";
import type { Participant } from "src/types/participant.ts";
import type { WSMsg } from "src/types/WSMsg.ts";

export enum SessionMsgType {
  FullSessionState = "fullSessionState",
  GameStateUpdate = "gameStateUpdate",
  StatusUpdate = "statusUpdate",
  UserJoined = "userJoined",
}

export type SessionMsg =
  | WSMsg<SessionMsgType.FullSessionState, Session>
  | WSMsg<SessionMsgType.GameStateUpdate, Record<string, string>>
  | WSMsg<SessionMsgType.StatusUpdate, SessionStatus>
  | WSMsg<SessionMsgType.UserJoined, { participant: Participant }>;
