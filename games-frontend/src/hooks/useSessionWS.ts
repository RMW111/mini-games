import { GameSlug } from "src/types/game.ts";
import { createClientWsMsg, createGameWsMsg } from "src/utils/createWsMsg.ts";
import { type ClientMsg, ClientMsgType } from "src/types/clientMsg.ts";
import type { ClientGameMsgPayload } from "src/types/gameMsg.ts";
import type { ClientCursorMsg } from "src/types/clientCursorMsg.ts";

export const useSessionWS = (socket: WebSocket | null, game: GameSlug) => {
  const stringifyAndSend = (message: ClientMsg) => {
    socket?.send(JSON.stringify(message));
  };

  const sendCursorMsg = (payload: ClientCursorMsg) => {
    const wsMessage = createClientWsMsg(ClientMsgType.Cursor, payload);
    stringifyAndSend(wsMessage);
  };

  const sendGameMsg = (payload: ClientGameMsgPayload) => {
    const gameMsg = createGameWsMsg(game, payload);
    const wsMessage = createClientWsMsg(ClientMsgType.Game, gameMsg);
    stringifyAndSend(wsMessage);
  };

  return { sendGameMsg, sendCursorMsg };
};
