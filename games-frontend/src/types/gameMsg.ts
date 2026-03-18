import type { WSMsg } from "src/types/WSMsg.ts";
import { GameSlug } from "src/types/game.ts";
import type { MinesweeperMsg } from "src/games/Minesweeper/Minesweeper.types.ts";
import type { GoMsg } from "src/games/Go/Go.types.ts";
import type { TicTacToeMsg } from "src/games/TicTacToe/TicTacToe.types.ts";

export type ClientGameMsg =
  | WSMsg<GameSlug.Minesweeper, MinesweeperMsg>
  | WSMsg<GameSlug.Go, GoMsg>
  | WSMsg<GameSlug.TicTacToe, TicTacToeMsg>;

export type ClientGameMsgPayload = MinesweeperMsg | GoMsg | TicTacToeMsg;
