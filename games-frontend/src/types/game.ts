export enum GameSlug {
  Minesweeper = "minesweeper",
  Go = "go",
  TicTacToe = "ticTacToe",
  Ragnarocks = "ragnarocks",
}

export interface GameInfo {
  id: string;
  slug: GameSlug;
  name: string;
  description: string;
  max_players: number | null;
  image_url: string | null;
}
