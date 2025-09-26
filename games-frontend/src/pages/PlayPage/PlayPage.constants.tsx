import { type ElementType, lazy } from "react";

const Minesweeper = lazy(() => import("../../games/Minesweeper/Minesweeper.tsx"));

export const gamesComponents: Record<string, ElementType> = {
  minesweeper: Minesweeper,
};
