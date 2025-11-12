import type { SessionMsg } from "src/types/sessionMsg.ts";
import type { WSMsg } from "src/types/WSMsg.ts";
import type { ServerCursorMsg } from "src/types/serverCursorMsg.ts";
import type { ServerGameMsg } from "src/types/serverGameMsg.ts";

export enum ServerMsgType {
  Session = "session",
  Cursor = "cursor",
  Game = "game",
}

export type ServerMsg =
  | WSMsg<ServerMsgType.Session, SessionMsg>
  | WSMsg<ServerMsgType.Cursor, ServerCursorMsg>
  | WSMsg<ServerMsgType.Game, ServerGameMsg>;
