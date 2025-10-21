import styles from "./Minesweeper.module.scss";
import { type Session, SessionStatus } from "src/types/session.ts";
import {
  CellState,
  type GameState,
  MinesweeperMsgType,
} from "src/games/Minesweeper/Minesweeper.types.ts";
import { type RefObject, useMemo, useState } from "react";
import { Cell } from "src/games/Minesweeper/components/Cell/Cell.tsx";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { API } from "src/api";
import { useNavigate, useParams } from "react-router-dom";
import { createMinesweeperWsMsg } from "src/games/Minesweeper/Minesweeper.utils.ts";

interface Props {
  socket: RefObject<WebSocket>;
  session: Session<GameState>;
}

export const Minesweeper = ({ socket, session }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Minesweeper);

  const onCellClick = (rowIndex: number, cellIndex: number) => {
    const cell = session.gameState.board.grid[rowIndex][cellIndex];

    const payload = { row: rowIndex, col: cellIndex };

    if (cell.state === CellState.Closed) {
      const message = createMinesweeperWsMsg(MinesweeperMsgType.CellClick, payload);
      sendGameMsg(message);
    } else if (cell.state === CellState.Opened && cell.minesAround > 0) {
      const message = createMinesweeperWsMsg(MinesweeperMsgType.NumClick, payload);
      sendGameMsg(message);
    }
  };

  const onCellFlagged = (rowIndex: number, cellIndex: number) => {
    const message = createMinesweeperWsMsg(MinesweeperMsgType.CellFlag, {
      row: rowIndex,
      col: cellIndex,
    });
    sendGameMsg(message);
  };

  const cells = session.gameState.board.grid.map((row, rowIndex) => {
    return row.map((cell, cellIndex) => (
      <Cell
        key={cellIndex}
        isGameOver={session.status === SessionStatus.Completed}
        cell={cell}
        onClick={() => onCellClick(rowIndex, cellIndex)}
        onFlagged={() => onCellFlagged(rowIndex, cellIndex)}
      />
    ));
  });

  const minesFlagged = useMemo(() => {
    return session.gameState.board.grid.reduce((mines, row) => {
      const flagged = row.reduce((mines, cell) => {
        if (cell.state === CellState.Flagged) {
          return mines + 1;
        }
        return mines;
      }, 0);
      return mines + flagged;
    }, 0);
  }, [session.gameState.board.grid]);

  const handleNewGame = () => {
    setIsLoading(true);
    API.sessions
      .createNew({ slug: slug! })
      .then(({ sessionId }) => {
        navigate(`/play/${slug}/${sessionId}`, { replace: true });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <div className={styles.hud}>
          <div className={styles.hudItem}>
            <span className={styles.hudLabel}>Мины</span>
            <span className={styles.hudValue}>
              🚩 {session.gameState.board.minesCount - minesFlagged}
            </span>
          </div>
          <button
            className={`${styles.resetButton} ${isLoading ? styles.loading : ""}`}
            onClick={handleNewGame}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Создание...
              </>
            ) : (
              "Новая игра"
            )}
          </button>
          <div className={styles.hudItem}>
            {/*<span className={styles.hudLabel}>Время</span>*/}
            {/*<span className={styles.hudValue}>⏱️ 123</span>*/}
          </div>
        </div>

        <div className={styles.board}>{cells}</div>
      </div>
    </div>
  );
};

export default Minesweeper;
