import { BoardSize } from "src/games/Go/Go.models.ts";

export const LETTERS_LABELS = "ABCDEFGHJKLMNOPQRST";

export const HOSHI_POSITIONS = {
  [BoardSize.Small]: [
    [2, 2],
    [2, 6],
    [6, 2],
    [6, 6],
    [4, 4],
  ],
  [BoardSize.Medium]: [
    [3, 3],
    [3, 9],
    [9, 3],
    [9, 9],
    [6, 6],
  ],
  [BoardSize.Large]: [
    [3, 3],
    [3, 9],
    [3, 15],
    [9, 3],
    [9, 9],
    [9, 15],
    [15, 3],
    [15, 9],
    [15, 15],
  ],
};

export const BOARD_SIZES = Object.values(BoardSize).filter((v) => typeof v === "number");
