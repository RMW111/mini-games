import type { WSMsg } from "src/types/WSMsg.ts";
import type { GridPos } from "src/types/gridPos.ts";

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

export enum CellState {
  Closed = "closed",
  Opened = "opened",
  Flagged = "flagged",
  Exploded = "exploded",
}

export enum MinesweeperMsgType {
  CellClick = "cellClick",
  NumClick = "numClick",
  CellFlag = "cellFlag",
}

export type MinesweeperMsg =
  | WSMsg<MinesweeperMsgType.CellClick, GridPos>
  | WSMsg<MinesweeperMsgType.CellFlag, GridPos>;

export type MinesweeperMsgPayload = GridPos;
