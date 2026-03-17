import styles from "./TicTacToe.module.scss";
import cn from "classnames";
import { useMemo, useState } from "react";
import { useAtom } from "jotai/index";
import { useNavigate, useParams } from "react-router-dom";
import { CellValue, type GameState, TicTacToeMsgType } from "src/games/TicTacToe/TicTacToe.types.ts";
import { createTicTacToeMsg } from "src/games/TicTacToe/TicTacToe.utils.ts";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { SessionStatus } from "src/types/session.ts";
import type { GameProps } from "src/types/gameProps.ts";
import { userAtom } from "src/store/user.ts";
import { Button } from "src/components/ui/Button/Button.tsx";
import { API } from "src/api";

const getWinningCells = (board: CellValue[][]): [number, number][] | null => {
  const lines: [number, number][][] = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    const val = board[a[0]][a[1]];
    if (val !== CellValue.Empty && val === board[b[0]][b[1]] && val === board[c[0]][c[1]]) {
      return line;
    }
  }

  return null;
};

const TicTacToe = ({ socket, session }: GameProps<GameState>) => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.TicTacToe);

  const { board, currentTurn, winner, isDraw } = session.gameState;
  const isGameOver = session.status === SessionStatus.Completed;

  const amICreator = useMemo(() => {
    const creator = session.participants.find((p) => p.role === ParticipantRole.Creator);
    return user?.id === creator?.userId;
  }, [session.participants, user?.id]);

  const myMark = amICreator ? CellValue.X : CellValue.O;
  const isMyTurn = currentTurn === myMark && !isGameOver;

  const winningCells = useMemo(() => {
    return winner ? getWinningCells(board) : null;
  }, [winner, board]);

  const isWinningCell = (row: number, col: number) =>
    winningCells?.some(([r, c]) => r === row && c === col) ?? false;

  const onCellClick = (row: number, col: number) => {
    if (!isMyTurn || board[row][col] !== CellValue.Empty) return;
    const message = createTicTacToeMsg(TicTacToeMsgType.MakeMove, [row, col]);
    sendGameMsg(message);
  };

  const handleNewGame = () => {
    setIsLoading(true);
    API.sessions
      .createNew({ slug: slug! })
      .then(({ sessionId }) => {
        navigate(`/play/${slug}/${sessionId}`, { replace: true });
      })
      .finally(() => setIsLoading(false));
  };

  const getStatusText = () => {
    if (winner) {
      return winner === myMark ? "Вы победили! 🎉" : "Вы проиграли 😔";
    }
    if (isDraw) return "Ничья 🤝";
    if (session.participants.length < 2) return "Ожидание соперника...";
    return isMyTurn ? "Ваш ход" : "Ход соперника";
  };

  const renderCell = (value: CellValue, row: number, col: number) => {
    const winning = isWinningCell(row, col);
    return (
      <div
        key={col}
        className={cn(styles.cell, {
          [styles.disabled]: !isMyTurn || value !== CellValue.Empty || isGameOver,
          [styles.winner]: winning,
          [styles.x]: value === CellValue.X,
          [styles.o]: value === CellValue.O,
        })}
        onClick={() => onCellClick(row, col)}
      >
        {value === CellValue.X ? "✕" : value === CellValue.O ? "○" : ""}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.status}>{getStatusText()}</div>

      <div className={styles.board}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>

      {isGameOver && (
        <div className={styles.actions}>
          <Button isLoading={isLoading} onClick={handleNewGame}>
            Новая игра
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
