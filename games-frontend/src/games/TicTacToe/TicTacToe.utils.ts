import { createWsMsg } from "src/utils/createWsMsg.ts";
import {
  type TicTacToeMsg,
  type TicTacToeMsgPayload,
  TicTacToeMsgType,
} from "src/games/TicTacToe/TicTacToe.types.ts";

export const createTicTacToeMsg = (
  type: TicTacToeMsgType,
  payload: TicTacToeMsgPayload
) => createWsMsg(type, payload) as TicTacToeMsg;
