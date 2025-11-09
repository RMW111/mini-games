export enum GameSlug {
  Minesweeper = "minesweeper",
  Go = "go",
}

export interface GameInfo {
  id: string;
  slug: GameSlug;
  name: string;
  description: string;
}
