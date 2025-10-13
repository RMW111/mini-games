import type { WSMsg } from "src/types/WSMsg.ts";
import { GameSlug } from "src/types/game.ts";
import type { MinesweeperMsg } from "src/games/Minesweeper/Minesweeper.types.ts";

export type ClientGameMsg = WSMsg<GameSlug.Minesweeper, MinesweeperMsg>;

export type ClientGameMsgPayload = MinesweeperMsg;
