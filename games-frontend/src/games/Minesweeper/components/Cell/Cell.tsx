import { type Cell as CellType, CellState } from "src/games/Minesweeper/Minesweeper.types.ts";
import styles from "./Cell.module.scss";
import { type MouseEvent } from "react";

interface Props {
  cell: CellType;
  isGameOver: boolean;
  onClick: () => void;
  onFlagged: () => void;
}

export const Cell = ({ cell, onFlagged, isGameOver, onClick }: Props) => {
  const { state, hasMine, minesAround } = cell;
  const isExploded = state === CellState.Exploded;

  const getContent = () => {
    if (isGameOver) {
      if (isExploded) return "💥"; // Та самая мина, которая взорвалась
      if (hasMine && state !== "flagged") return "💣"; // Другие мины
      if (!hasMine && state === "flagged") return "❌"; // Неправильно поставленный флаг
    }

    if (state === "flagged") return "🚩";
    if (state === "opened") {
      return minesAround > 0 ? minesAround : "";
    }
    return "";
  };

  let cellClass = styles.cell;
  if (isGameOver && isExploded) {
    cellClass += ` ${styles.exploded}`;
  } else if (isGameOver && hasMine) {
    cellClass += ` ${styles.mine}`;
  } else if (isGameOver && !hasMine && state === "flagged") {
    cellClass += ` ${styles.wrongFlag}`;
  } else {
    cellClass += ` ${styles[state]} ${styles[`mines${minesAround}`]}`;
  }

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    onFlagged();
  };

  return (
    <div className={cellClass} onClick={onClick} onContextMenu={onContextMenu}>
      {getContent()}
    </div>
  );
};
