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

interface Score {
  whiteCaptured: number;
  blackCaptured: number;
}

export interface GameState {
  creatorColor: StoneColor;
  currentTurn: StoneColor;
  board: StoneColor[][];
  lastMoveWasPass: boolean;
  ko?: Coords;
  lastStonePlaced?: Coords;
  score: Score;
}

export interface Captured {
  white: number;
  black: number;
}

export enum GoMsgType {
  PlaceStone = "placeStone",
  Pass = "pass",
}

export type GoMsg = WSMsg<GoMsgType.PlaceStone, Coords> | WSMsg<GoMsgType.Pass>;

export type GoMsgPayload = Coords;

export enum GoServerMsgType {
  Passed = "passed",
}

export type GoServerMsg = WSMsg<GoServerMsgType.Passed>;

// export type GoServerMsgPayload = ;
