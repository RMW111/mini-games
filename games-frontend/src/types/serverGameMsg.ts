import type { WSMsg } from "src/types/WSMsg.ts";
import { GameSlug } from "src/types/game.ts";
import { type GoServerMsg } from "src/games/Go/Go.types.ts";

export enum ServerGameMsgType {
  Go = GameSlug.Go,
}

export type ServerGameMsg = WSMsg<ServerGameMsgType.Go, GoServerMsg>;

export type ServerGameMsgPayload = GoServerMsg;
