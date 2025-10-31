import styles from "./Minesweeper.module.scss";
import { type Session, SessionStatus } from "src/types/session.ts";
import {
  CellState,
  type GameState,
  MinesweeperMsgType,
} from "src/games/Minesweeper/Minesweeper.types.ts";
import { type RefObject, useEffect, useMemo, useState } from "react";
import { Cell } from "src/games/Minesweeper/components/Cell/Cell.tsx";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { API } from "src/api";
import { useNavigate, useParams } from "react-router-dom";
import { createMinesweeperWsMsg } from "src/games/Minesweeper/Minesweeper.utils.ts";
import { useAtom } from "jotai/index";
import { userAtom } from "src/store/user.ts";
import { ResultPopup } from "src/games/Minesweeper/components/ResultPopup/ResultPopup.tsx";
import { Button } from "src/components/ui/Button/Button.tsx";
import { participantsColors } from "src/pages/PlayPage/PlayPage.constants.tsx";

interface Props {
  socket: RefObject<WebSocket>;
  session: Session<GameState>;
}

export const Minesweeper = ({ socket, session }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Minesweeper);
  const [isResultPopupOpened, setIsResultPopupOpened] = useState(false);

  useEffect(() => {
    setIsResultPopupOpened(session.status === SessionStatus.Completed);
  }, [session.status]);

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
    const cell = session.gameState.board.grid[rowIndex][cellIndex];

    if (cell.flaggedBy && cell.flaggedBy !== user?.id) return;

    const message = createMinesweeperWsMsg(MinesweeperMsgType.CellFlag, {
      row: rowIndex,
      col: cellIndex,
    });
    sendGameMsg(message);
  };

  const rows = session.gameState.board.grid.map((row, rowIndex) => {
    return (
      <div className={styles.row} key={rowIndex}>
        {row.map((cell, cellIndex) => {
          const participantIndex = session.participants.findIndex(
            (x) => x.userId === cell.flaggedBy
          );

          const flagColor =
            participantIndex > -1 ? participantsColors[participantIndex] : participantsColors[0];
          return (
            <Cell
              key={cellIndex}
              isGameOver={session.status === SessionStatus.Completed}
              cell={cell}
              onClick={() => onCellClick(rowIndex, cellIndex)}
              onFlagged={() => onCellFlagged(rowIndex, cellIndex)}
              flagColor={flagColor}
            />
          );
        })}
      </div>
    );
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

          <Button isLoading={isLoading} onClick={handleNewGame}>
            Новая игра
          </Button>

          <div className={styles.hudItem}></div>
        </div>

        <div className={styles.board}>{rows}</div>
      </div>

      {session.status === SessionStatus.Completed && (
        <ResultPopup
          isOpened={isResultPopupOpened}
          isLoading={isLoading}
          session={session}
          onNewGameClick={handleNewGame}
          onClose={() => setIsResultPopupOpened(false)}
        />
      )}
    </div>
  );
};

export default Minesweeper;
