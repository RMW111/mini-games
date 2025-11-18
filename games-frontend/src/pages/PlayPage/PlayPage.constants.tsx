import { type ElementType, lazy } from "react";
import { GameSlug } from "src/types/game.ts";

const Minesweeper = lazy(() => import("../../games/Minesweeper/Minesweeper.tsx"));
const Go = lazy(() => import("../../games/Go/Go.tsx"));

export const gamesComponents: Record<GameSlug, ElementType> = {
  [GameSlug.Minesweeper]: Minesweeper,
  [GameSlug.Go]: Go,
};

export enum SocketErrorCode {
  AbnormalClosure = 1006,
  SessionCompleted = 1008,
  SessionFull = 1009,
}

export const participantsColors = [
  "#ff0000",
  "#A855F7",
  "#10B981",
  "#3B82F6",
  "#000000",
  "#FB923C",
  "#EC4899",
];
