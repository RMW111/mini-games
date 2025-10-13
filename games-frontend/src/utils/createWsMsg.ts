import type { WSMsg } from "src/types/WSMsg.ts";
import { GameSlug } from "src/types/game.ts";
import type { ClientGameMsg, ClientGameMsgPayload } from "src/types/gameMsg.ts";
import type { ClientMsg, ClientMsgPayload, ClientMsgType } from "src/types/clientMsg.ts";

export const createClientWsMsg = (type: ClientMsgType, payload: ClientMsgPayload) =>
  createWsMsg(type, payload) as ClientMsg;

export const createGameWsMsg = (type: GameSlug, payload: ClientGameMsgPayload) =>
  createWsMsg(type, payload) as ClientGameMsg;

export const createWsMsg = <Type, Payload>(type: Type, payload: Payload): WSMsg<Type, Payload> => {
  return { type, payload };
};
