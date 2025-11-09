export enum BoardSize {
  Small = 9,
  Medium = 13,
  Large = 19,
}

export enum StoneColor {
  Black = 1,
  White = 2,
}

export interface GameState {
  creatorColor: StoneColor;
  board: StoneColor[][];
}
