import type { WSMsg } from "src/types/WSMsg.ts";
import type { ClientGameMsg } from "src/types/gameMsg.ts";
import type { ClientCursorMsg } from "src/types/clientCursorMsg.ts";

export enum ClientMsgType {
  Game = "game",
  Cursor = "cursor",
}

export type ClientMsg =
  | WSMsg<ClientMsgType.Game, ClientGameMsg>
  | WSMsg<ClientMsgType.Cursor, ClientCursorMsg>;

export type ClientMsgPayload = ClientGameMsg | ClientCursorMsg;
