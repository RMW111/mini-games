import type { WSMsg } from "src/types/WSMsg.ts";
import type { Position } from "src/pages/PlayPage/PlayPage.types.ts";

export enum ServerCursorMsgType {
  Move = "move",
}

interface MovePayload {
  pos: Position;
  userId: string;
}

export type ServerCursorMsg = WSMsg<ServerCursorMsgType.Move, MovePayload>;
