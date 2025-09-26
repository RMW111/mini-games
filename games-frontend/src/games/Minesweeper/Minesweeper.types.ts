export enum MinesweeperMsg {
  CellClick = "cellClick",
  CellFlag = "cellFlag",
}

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

export enum CellState {
  Closed = "closed",
  Opened = "opened",
  Flagged = "flagged",
  Exploded = "exploded",
  Pending = "pending",
}
