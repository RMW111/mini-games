import styles from "./Ragnarocks.module.scss";
import cn from "classnames";
import { useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai/index";
import { useNavigate, useParams } from "react-router-dom";
import {
  CellValue,
  type GameState,
  PlayerColor,
  RagnarocksMsgType,
  TurnPhase,
} from "src/games/Ragnarocks/Ragnarocks.types.ts";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HEX_SIZE,
  ROW_SIZES,
  hexPoints,
  hexToPixel,
} from "src/games/Ragnarocks/Ragnarocks.constants.ts";
import {
  createRagnarocksMsg,
  getOppositeColor,
  getReachableCells,
  isVikingNomadic,
} from "src/games/Ragnarocks/Ragnarocks.utils.ts";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { SessionStatus } from "src/types/session.ts";
import type { GameProps } from "src/types/gameProps.ts";
import { userAtom } from "src/store/user.ts";
import { Button } from "src/components/ui/Button/Button.tsx";
import { API } from "src/api";

const Ragnarocks = ({ socket, session }: GameProps<GameState>) => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Ragnarocks);
  const [selectedViking, setSelectedViking] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { board, currentTurn, phase, activeViking, won, whiteScore, redScore } =
    session.gameState;
  const isGameOver = session.status === SessionStatus.Completed;

  const amICreator = useMemo(() => {
    const creator = session.participants.find((p) => p.role === ParticipantRole.Creator);
    return user?.id === creator?.userId;
  }, [session.participants, user?.id]);

  const myColor = amICreator
    ? session.gameState.creatorColor
    : getOppositeColor(session.gameState.creatorColor);

  const isMyTurn = currentTurn === myColor && !isGameOver;

  const myVikingValue =
    myColor === PlayerColor.White ? CellValue.WhiteViking : CellValue.RedViking;

  // Compute reachable cells for highlights
  const reachableCells = useMemo(() => {
    if (!isMyTurn) return new Set<string>();

    if (phase === TurnPhase.MoveViking && selectedViking) {
      const [r, c] = selectedViking;
      return new Set(
        getReachableCells(board, r, c).map(([rr, cc]) => `${rr},${cc}`),
      );
    }

    if (phase === TurnPhase.PlaceRunestone && activeViking) {
      const [r, c] = activeViking;
      return new Set(
        getReachableCells(board, r, c).map(([rr, cc]) => `${rr},${cc}`),
      );
    }

    return new Set<string>();
  }, [isMyTurn, phase, selectedViking, activeViking, board]);

  // Check if player can make any move (for skip button)
  const canSkip = useMemo(() => {
    if (!isMyTurn || phase !== TurnPhase.MoveViking) return false;

    // Check if any nomadic viking can move (or stay) and then place a runestone
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] !== myVikingValue) continue;
        if (!isVikingNomadic(board, row, col)) continue;

        // Check "stay in place": can place runestone from current position?
        const stayRuneCells = getReachableCells(board, row, col);
        if (stayRuneCells.length > 0) return false;

        // Check actual moves
        const moveCells = getReachableCells(board, row, col);
        for (const [mr, mc] of moveCells) {
          const tempBoard = board.map((r) => [...r]);
          tempBoard[row][col] = CellValue.Empty;
          tempBoard[mr][mc] = myVikingValue;
          const runeCells = getReachableCells(tempBoard, mr, mc);
          if (runeCells.length > 0) return false;
        }
      }
    }

    return true; // No valid moves available
  }, [isMyTurn, phase, board, myVikingValue]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!isMyTurn || isGameOver) return;

      if (phase === TurnPhase.MoveViking) {
        const cell = board[row][col];

        // Click on own nomadic viking to select/deselect it
        if (cell === myVikingValue && isVikingNomadic(board, row, col)) {
          if (selectedViking && selectedViking[0] === row && selectedViking[1] === col) {
            // Double-click on selected viking = stay in place (move 0 distance)
            const msg = createRagnarocksMsg(RagnarocksMsgType.MoveViking, {
              from: [row, col],
              to: [row, col],
            });
            sendGameMsg(msg);
            setSelectedViking(null);
          } else {
            setSelectedViking([row, col]);
          }
          return;
        }

        // Click on a reachable cell to move
        if (selectedViking && reachableCells.has(`${row},${col}`)) {
          const msg = createRagnarocksMsg(RagnarocksMsgType.MoveViking, {
            from: [selectedViking[0], selectedViking[1]],
            to: [row, col],
          });
          sendGameMsg(msg);
          setSelectedViking(null);
          return;
        }
      }

      if (phase === TurnPhase.PlaceRunestone) {
        if (reachableCells.has(`${row},${col}`)) {
          const msg = createRagnarocksMsg(RagnarocksMsgType.PlaceRunestone, [row, col]);
          sendGameMsg(msg);
          return;
        }
      }
    },
    [isMyTurn, isGameOver, phase, board, myVikingValue, selectedViking, reachableCells, sendGameMsg],
  );

  const handleCancelMove = () => {
    const msg = createRagnarocksMsg(RagnarocksMsgType.CancelMove);
    sendGameMsg(msg);
  };

  const handleSkip = () => {
    const msg = createRagnarocksMsg(RagnarocksMsgType.Skip);
    sendGameMsg(msg);
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

  const getCellColor = (cellValue: number, row: number, col: number) => {
    const key = `${row},${col}`;
    const isReachable = reachableCells.has(key);
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;

    if (isSelected) return "#7cb342";

    switch (cellValue) {
      case CellValue.WhiteViking:
        return "#e8e8e8";
      case CellValue.RedViking:
        return "#e05555";
      case CellValue.Runestone:
        return "#6b7280";
      default:
        return isReachable ? "#a5d6a7" : "#c8e6c9";
    }
  };

  const getCellStroke = (cellValue: number, row: number, col: number) => {
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;
    if (isSelected) return "#558b2f";

    const isReachable = reachableCells.has(`${row},${col}`);
    if (isReachable) return "#66bb6a";

    return "#8da08d";
  };

  const getCellCursor = (cellValue: number, row: number, col: number) => {
    if (!isMyTurn || isGameOver) return "default";

    if (phase === TurnPhase.MoveViking) {
      if (cellValue === myVikingValue && isVikingNomadic(board, row, col)) return "pointer";
      if (selectedViking && reachableCells.has(`${row},${col}`)) return "pointer";
    }

    if (phase === TurnPhase.PlaceRunestone) {
      if (reachableCells.has(`${row},${col}`)) return "pointer";
    }

    return "default";
  };

  const getStatusText = () => {
    if (won) {
      return won === myColor ? "Вы победили!" : "Вы проиграли";
    }
    if (session.participants.length < 2) return "Ожидание соперника...";
    if (!isMyTurn) return "Ход соперника";
    if (phase === TurnPhase.MoveViking) return "Выберите викинга и передвиньте его";
    if (phase === TurnPhase.PlaceRunestone) return "Поставьте рунный камень";
    return "";
  };

  const getPhaseText = () => {
    if (isGameOver || !isMyTurn) return null;
    if (phase === TurnPhase.MoveViking) {
      if (selectedViking) return "Нажмите на подсвеченную клетку для хода";
      return "Нажмите на своего кочующего викинга";
    }
    if (phase === TurnPhase.PlaceRunestone) return "Нажмите на подсвеченную клетку";
    return null;
  };

  // Render SVG hexes
  const hexes = board.flatMap((row, rowI) =>
    row.map((cell, colI) => {
      const { x, y } = hexToPixel(rowI, colI);
      return (
        <g key={`${rowI}-${colI}`} onClick={() => handleCellClick(rowI, colI)}>
          <polygon
            points={hexPoints(x, y)}
            fill={getCellColor(cell, rowI, colI)}
            stroke={getCellStroke(cell, rowI, colI)}
            strokeWidth={1.5}
            style={{ cursor: getCellCursor(cell, rowI, colI) }}
          />
          {/* Viking icon */}
          {(cell === CellValue.WhiteViking || cell === CellValue.RedViking) && (
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fontSize={HEX_SIZE * 0.8}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              ⛵
            </text>
          )}
          {/* Runestone icon */}
          {cell === CellValue.Runestone && (
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fontSize={HEX_SIZE * 0.7}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              ᛟ
            </text>
          )}
        </g>
      );
    }),
  );

  return (
    <div className={styles.container}>
      <div className={styles.boardContainer}>
        <svg
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        >
          {hexes}
        </svg>
      </div>

      <div className={styles.sidePanel}>
        <div
          className={cn(styles.turnIndicator, {
            [styles.turnIndicator_myTurn]: isMyTurn && !isGameOver,
          })}
        >
          {getStatusText()}
        </div>

        {getPhaseText() && <div className={styles.phaseLabel}>{getPhaseText()}</div>}

        <div className={styles.scores}>
          <div className={styles.scoreRow}>
            <span className={styles.scoreLabel}>
              <span className={cn(styles.colorDot, styles.colorDot_white)} />
              Белые {myColor === PlayerColor.White ? "(вы)" : ""}
            </span>
            <span>{whiteScore}</span>
          </div>
          <div className={styles.scoreRow}>
            <span className={styles.scoreLabel}>
              <span className={cn(styles.colorDot, styles.colorDot_red)} />
              Красные {myColor === PlayerColor.Red ? "(вы)" : ""}
            </span>
            <span>{redScore}</span>
          </div>
        </div>

        {isMyTurn && phase === TurnPhase.PlaceRunestone && (
          <Button className={styles.skipButton} variant="secondary" onClick={handleCancelMove}>
            Отменить ход
          </Button>
        )}

        {canSkip && isMyTurn && (
          <Button className={styles.skipButton} onClick={handleSkip}>
            Пропустить ход
          </Button>
        )}

        {isGameOver && (
          <div className={styles.gameOverPanel}>
            <div className={styles.gameOverTitle}>
              {whiteScore} : {redScore}
            </div>
            <Button isLoading={isLoading} onClick={handleNewGame}>
              Новая игра
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ragnarocks;
