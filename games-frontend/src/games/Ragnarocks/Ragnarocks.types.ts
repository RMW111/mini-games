import type { WSMsg } from "src/types/WSMsg.ts";
import type { Coords } from "src/types/coords.ts";

// Cell values match backend u8 representation
export enum CellValue {
  Empty = 0,
  WhiteViking = 1,
  RedViking = 2,
  Runestone = 3,
}

export enum PlayerColor {
  White = 1,
  Red = 2,
}

export enum TurnPhase {
  MoveViking = "moveViking",
  PlaceRunestone = "placeRunestone",
}

export interface GameState {
  creatorColor: PlayerColor;
  currentTurn: PlayerColor;
  board: number[][];
  lastSkip: boolean;
  won: PlayerColor | null;
  whiteScore: number;
  redScore: number;
  phase: TurnPhase;
  activeViking: Coords | null;
  previousVikingPos: Coords | null;
}

export enum RagnarocksMsgType {
  MoveViking = "moveViking",
  PlaceRunestone = "placeRunestone",
  CancelMove = "cancelMove",
  Skip = "skip",
}

export type RagnarocksMsg =
  | WSMsg<RagnarocksMsgType.MoveViking, { from: Coords; to: Coords }>
  | WSMsg<RagnarocksMsgType.PlaceRunestone, Coords>
  | WSMsg<RagnarocksMsgType.CancelMove>
  | WSMsg<RagnarocksMsgType.Skip>;

export type RagnarocksMsgPayload = { from: Coords; to: Coords } | Coords | undefined;
