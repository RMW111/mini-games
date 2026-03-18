import type { WSMsg } from "src/types/WSMsg.ts";

export enum CellValue {
  Empty = "Empty",
  X = "X",
  O = "O",
}

export interface GameState {
  board: CellValue[][];
  currentTurn: CellValue;
  winner: CellValue | null;
  isDraw: boolean;
}

export enum TicTacToeMsgType {
  MakeMove = "makeMove",
}

export type TicTacToeMsg = WSMsg<TicTacToeMsgType.MakeMove, [number, number]>;

export type TicTacToeMsgPayload = [number, number];
