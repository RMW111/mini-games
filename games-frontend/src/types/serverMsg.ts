import type { SessionMsg } from "src/types/sessionMsg.ts";
import type { WSMsg } from "src/types/WSMsg.ts";
import type { ServerCursorMsg } from "src/types/serverCursorMsg.ts";

export enum ServerMsgType {
  Session = "session",
  Cursor = "cursor",
}

export type ServerMsg =
  | WSMsg<ServerMsgType.Session, SessionMsg>
  | WSMsg<ServerMsgType.Cursor, ServerCursorMsg>;
// | {
//     type: ServerWSEventType.Game;
//     payload: unknown;
//   };
