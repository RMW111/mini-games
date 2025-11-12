import type { WSMsg } from "src/types/WSMsg.ts";
import { GameSlug } from "src/types/game.ts";
import type { MinesweeperMsg } from "src/games/Minesweeper/Minesweeper.types.ts";
import type { GoMsg } from "src/games/Go/Go.types.ts";

export type ClientGameMsg = WSMsg<GameSlug.Minesweeper, MinesweeperMsg> | WSMsg<GameSlug.Go, GoMsg>;

export type ClientGameMsgPayload = MinesweeperMsg | GoMsg;
