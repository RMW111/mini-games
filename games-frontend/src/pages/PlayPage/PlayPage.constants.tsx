import { type ElementType, lazy } from "react";

const Minesweeper = lazy(() => import("../../games/Minesweeper/Minesweeper.tsx"));

export const gamesComponents: Record<string, ElementType> = {
  minesweeper: Minesweeper,
};

export const cursorColors = ["#000000", "#A855F7", "#FB923C", "#3B82F6", "#10B981", "#EC4899"];
