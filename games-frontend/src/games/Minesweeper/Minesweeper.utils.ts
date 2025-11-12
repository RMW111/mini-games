import { createWsMsg } from "src/utils/createWsMsg.ts";
import {
  type MinesweeperMsg,
  type MinesweeperMsgPayload,
  MinesweeperMsgType,
} from "src/games/Minesweeper/Minesweeper.types.ts";

export const createMinesweeperMsg = (type: MinesweeperMsgType, payload: MinesweeperMsgPayload) =>
  createWsMsg(type, payload) as MinesweeperMsg;
