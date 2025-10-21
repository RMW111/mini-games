import type { WSMsg } from "src/types/WSMsg.ts";

export interface GameState {
  board: {
    grid: Cell[][];
    initialized: boolean;
    minesCount: number;
  };
}

export interface Cell {
  state: CellState;
  hasMine: boolean;
  minesAround: number;
}

export interface CellPos {
  row: number;
  col: number;
}

export enum CellState {
  Closed = "closed",
  Opened = "opened",
  Flagged = "flagged",
  Exploded = "exploded",
  Pending = "pending",
}

export enum MinesweeperMsgType {
  CellClick = "cellClick",
  NumClick = "numClick",
  CellFlag = "cellFlag",
}

export type MinesweeperMsg =
  | WSMsg<MinesweeperMsgType.CellClick, CellPos>
  | WSMsg<MinesweeperMsgType.CellFlag, CellPos>;

export type MinesweeperMsgPayload = CellPos;
