import type { WSMsg } from "src/types/WSMsg.ts";
import type { Coords } from "src/types/coords.ts";

export enum BoardSize {
  Small = 9,
  Medium = 13,
  Large = 19,
}

export enum StoneColor {
  Black = 1,
  White = 2,
}

export interface Score {
  whiteCaptured: number;
  whiteTerritory: Coords[];
  whiteDeadStones: Coords[];
  blackCaptured: number;
  blackTerritory: Coords[];
  blackDeadStones: Coords[];
}

export enum Mode {
  Playing = "playing",
  Scoring = "scoring",
}

export enum WinningReason {
  Resignation = "resignation",
  Score = "score",
  Timeout = "timeout",
}

export interface GameState {
  creatorColor: StoneColor;
  currentTurn: StoneColor;
  board: StoneColor[][];
  lastMoveWasPass: boolean;
  ko?: Coords;
  lastStonePlaced?: Coords;
  score: Score;
  mode: Mode;
  won?: StoneColor;
  winningReason?: WinningReason;
  blackApprovedScore: boolean;
  whiteApprovedScore: boolean;
}

export interface Captured {
  white: number;
  black: number;
}

export enum GoMsgType {
  PlaceStone = "placeStone",
  Pass = "pass",
  CancelScoring = "cancelScoring",
  Resign = "resign",
  ToggleEaten = "toggleEaten",
  ApproveScore = "approveScore",
}

export type GoMsg = WSMsg<GoMsgType.PlaceStone, Coords> | WSMsg<GoMsgType.Pass>;

export type GoMsgPayload = Coords;

export enum GoServerMsgType {
  ScoringCanceled = "scoringCanceled",
  Resigned = "resigned",
}

export type GoServerMsg =
  | WSMsg<GoServerMsgType.ScoringCanceled>
  | WSMsg<GoServerMsgType.Resigned, StoneColor>;

// export type GoServerMsgPayload = ;
