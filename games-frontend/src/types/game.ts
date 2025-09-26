export enum GameSlug {
  Minesweeper = "minesweeper",
  Chess = "chess",
}

export interface GameInfo {
  id: string;
  slug: GameSlug;
  name: string;
  description: string;
}
