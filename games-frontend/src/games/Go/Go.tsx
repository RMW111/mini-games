import styles from "./Go.module.scss";
import cn from "classnames";
import { BoardSize, type GameState } from "src/games/Go/Go.models.ts";
import { HOSHI_POSITIONS, LETTERS_LABELS } from "src/games/Go/Go.constants.ts";
import type { GameProps } from "src/types/gameProps.ts";
import { Stone } from "src/games/Go/components/Stone/Stone.tsx";

const lineGaps = 38;
const lineWidth = 1;

const Go = ({ session }: GameProps<GameState>) => {
  // todo Можно увеличивать доски с помощью scale
  const boardSize = session.gameState.board[0].length as BoardSize;
  const boardWidth = boardSize * lineWidth + (boardSize - 1) * lineGaps;

  const lines = Array.from({ length: boardSize }).map((_, i) => {
    return (
      <>
        <div className={styles.line} style={{ top: i * (lineGaps + lineWidth) }} />
        <div
          className={cn(styles.line, styles.line_vertical)}
          style={{ left: `calc(-50% + ${i * (lineGaps + lineWidth)}px)` }}
        />
      </>
    );
  });

  const stones = session.gameState.board.map((row, rowI) => {
    return row.map((color, colI) => {
      const top = rowI * lineGaps + rowI * lineWidth - 19;
      const left = colI * lineGaps + colI * lineWidth - 19;
      return (
        <Stone
          style={{ top, left }}
          className={cn(styles.stone, styles.hiddenStone)}
          color={color}
        />
      );
    });
  });

  const numbers = Array.from({ length: boardSize }).map((_, i) => {
    const bottom = i * lineGaps + i * lineWidth - 9;
    return (
      <>
        <div style={{ bottom }} className={cn(styles.number, styles.number_left)}>
          {i + 1}
        </div>
        <div style={{ bottom }} className={cn(styles.number, styles.number_right)}>
          {i + 1}
        </div>
      </>
    );
  });

  const letters = Array.from({ length: boardSize }).map((_, i) => {
    const left = i * lineGaps + i * lineWidth - 9;
    return (
      <>
        <div style={{ left }} className={cn(styles.letter, styles.letter_top)}>
          {LETTERS_LABELS[i]}
        </div>
        <div style={{ left }} className={cn(styles.letter, styles.letter_bottom)}>
          {LETTERS_LABELS[i]}
        </div>
      </>
    );
  });

  const hoshi = HOSHI_POSITIONS[boardSize].map(([rowI, colI]) => {
    const top = rowI * lineGaps + rowI * lineWidth - 3;
    const left = colI * lineGaps + colI * lineWidth - 3;
    return <div style={{ top, left }} className={styles.hoshi} />;
  });

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper} onContextMenu={(e) => e.preventDefault()}>
        <div className={styles.boardContainer}>
          <div className={styles.board} style={{ width: boardWidth, height: boardWidth }}>
            {lines}
            {stones}
            {numbers}
            {letters}
            {hoshi}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Go;
