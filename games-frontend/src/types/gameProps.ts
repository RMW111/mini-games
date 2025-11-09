import type { RefObject } from "react";
import type { Session } from "src/types/session.ts";

export interface GameProps<T> {
  socket: RefObject<WebSocket>;
  session: Session<T>;
}
