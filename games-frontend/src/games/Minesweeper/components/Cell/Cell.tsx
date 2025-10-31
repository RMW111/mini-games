import { type Cell as CellType, CellState } from "src/games/Minesweeper/Minesweeper.types.ts";
import styles from "./Cell.module.scss";
import { type MouseEvent } from "react";

interface Props {
  cell: CellType;
  isGameOver: boolean;
  flagColor: string;
  onClick: () => void;
  onFlagged: () => void;
}

export const Cell = ({ cell, onFlagged, isGameOver, flagColor, onClick }: Props) => {
  const { state, hasMine, minesAround } = cell;
  const isExploded = state === CellState.Exploded;

  const getContent = () => {
    if (isGameOver) {
      if (isExploded) return "💥"; // Та самая мина, которая взорвалась
      if (hasMine && state !== "flagged") return "💣"; // Другие мины
      if (!hasMine && state === "flagged") return "❌"; // Неправильно поставленный флаг
    }

    // if (state === "flagged") return "🚩";
    if (state === "flagged")
      return (
        <svg
          width={30}
          height={30}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            opacity="0.5"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.5 1.75C6.5 1.33579 6.16421 1 5.75 1C5.33579 1 5 1.33579 5 1.75V21.75C5 22.1642 5.33579 22.5 5.75 22.5C6.16421 22.5 6.5 22.1642 6.5 21.75V13.6V3.6V1.75Z"
            fill="#1C274C"
          />
          <path
            d="M13.5582 3.87333L13.1449 3.70801C11.5821 3.08288 9.8712 2.9258 8.22067 3.25591L6.5 3.60004V13.6L8.22067 13.2559C9.8712 12.9258 11.5821 13.0829 13.1449 13.708C14.8385 14.3854 16.7024 14.5119 18.472 14.0695L18.5721 14.0445C19.1582 13.898 19.4361 13.2269 19.1253 12.7089L17.5647 10.1078C17.2232 9.53867 17.0524 9.25409 17.0119 8.94455C16.9951 8.81543 16.9951 8.68466 17.0119 8.55553C17.0524 8.24599 17.2232 7.96141 17.5647 7.39225L18.8432 5.26136C19.1778 4.70364 18.6711 4.01976 18.0401 4.17751C16.5513 4.54971 14.9831 4.44328 13.5582 3.87333Z"
            fill={flagColor}
          />
        </svg>
      );
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
