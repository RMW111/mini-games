import type { WSMsg } from "src/types/WSMsg.ts";

export type BoardGrid = Cell[][];

export interface Board {
  grid: BoardGrid;
  initialized: boolean;
  exploded: boolean;
  minesCount: number;
}

export interface StatInfo {
  cellsOpened: number;
  exploded: boolean;
}

export type Stats = Record<string, StatInfo>;

export interface GameState {
  board: Board;
  stats: Stats;
}

export interface Cell {
  state: CellState;
  hasMine: boolean;
  minesAround: number;
  flaggedBy: string;
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
