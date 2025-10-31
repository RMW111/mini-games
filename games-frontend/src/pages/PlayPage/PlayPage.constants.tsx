import { type ElementType, lazy } from "react";

const Minesweeper = lazy(() => import("../../games/Minesweeper/Minesweeper.tsx"));

export const gamesComponents: Record<string, ElementType> = {
  minesweeper: Minesweeper,
};

export const participantsColors = [
  "#ff0000",
  "#A855F7",
  "#10B981",
  "#3B82F6",
  "#000000",
  "#FB923C",
  "#EC4899",
];
