import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Session } from "src/types/session.ts";
import type { ServerGameMsgPayload } from "src/types/serverGameMsg.ts";

export interface GameProps<T> {
  socket: RefObject<WebSocket>;
  session: Session<T>;
  updateGameState: Dispatch<SetStateAction<T>>;
  serverMsg: ServerGameMsgPayload;
}
