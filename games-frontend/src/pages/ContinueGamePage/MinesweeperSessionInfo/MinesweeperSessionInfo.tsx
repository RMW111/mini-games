import { CellState, type GameState } from "src/games/Minesweeper/Minesweeper.types.ts";
import { useMemo } from "react";

export const MinesweeperSessionInfo = ({ gameState }: { gameState: GameState }) => {
  const [openedCells, flaggedCells] = useMemo(() => {
    const openedCells = gameState.board.grid
      .flat()
      .filter((col) => col.state === CellState.Opened).length;

    const flaggedCells = gameState.board.grid
      .flat()
      .filter((col) => col.state === CellState.Flagged).length;

    return [openedCells, flaggedCells];
  }, [gameState]);

  return (
    <div>
      Открыто креток: {openedCells} из{" "}
      {gameState.board.grid.length * gameState.board.grid[0].length - gameState.board.minesCount}
      <br />
      Разминировано мин: {flaggedCells} из {gameState.board.minesCount}
    </div>
  );
};
