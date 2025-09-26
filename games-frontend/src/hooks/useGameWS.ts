import { GameSlug } from "src/types/game.ts";
import { createWsMessage } from "src/utils/createWsMessage.ts";

export const useGameWS = (socket: WebSocket, game: GameSlug) => {
  const sendGameMsg = (payload: object) => {
    const gameMsg = createWsMessage(game, payload);
    const wsMessage = createWsMessage("game", gameMsg);
    socket.send(JSON.stringify(wsMessage));
  };

  return { sendGameMsg };
};
