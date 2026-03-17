export enum GameSlug {
  Minesweeper = "minesweeper",
  Go = "go",
  TicTacToe = "ticTacToe",
}

export interface GameInfo {
  id: string;
  slug: GameSlug;
  name: string;
  description: string;
}
