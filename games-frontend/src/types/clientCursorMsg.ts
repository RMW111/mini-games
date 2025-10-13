import type { WSMsg } from "src/types/WSMsg.ts";
import type { Position } from "src/pages/PlayPage/PlayPage.types.ts";

export enum ClientCursorMsgType {
  Move = "move",
}

export type ClientCursorMsg = WSMsg<ClientCursorMsgType.Move, Position>;

export type ClientCursorMsgPayload = Position;
