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

// ─── Board color palette (dark theme) ────────────────────

const COLORS = {
  cellEmpty: "#2c2c2c",
  cellEmptyStroke: "#444444",
  cellReachable: "#3a3a3a",
  cellReachableStroke: "#ffffff",
  cellSelected: "#4caf50",
  cellSelectedStroke: "#388e3c",
  whiteViking: "#e0e0e0",
  whiteVikingStroke: "#aaaaaa",
  redViking: "#ff4d4d",
  redVikingStroke: "#cc3333",
  runestone: "#555555",
  runestoneStroke: "#777777",
};

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
  const isWaiting = session.participants.length < 2;
  const isOpponentTurn = !isMyTurn && !isGameOver && !isWaiting;

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

    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        if (board[row][col] !== myVikingValue) continue;
        if (!isVikingNomadic(board, row, col)) continue;

        const stayRuneCells = getReachableCells(board, row, col);
        if (stayRuneCells.length > 0) return false;

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

    return true;
  }, [isMyTurn, phase, board, myVikingValue]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!isMyTurn || isGameOver) return;

      if (phase === TurnPhase.MoveViking) {
        const cell = board[row][col];

        if (cell === myVikingValue && isVikingNomadic(board, row, col)) {
          if (selectedViking && selectedViking[0] === row && selectedViking[1] === col) {
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

  // ─── Board rendering helpers ───────────────────────────

  const getCellFill = (cellValue: number, row: number, col: number) => {
    const key = `${row},${col}`;
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;

    if (isSelected) return COLORS.cellSelected;

    switch (cellValue) {
      case CellValue.WhiteViking:
        return COLORS.whiteViking;
      case CellValue.RedViking:
        return COLORS.redViking;
      case CellValue.Runestone:
        return COLORS.runestone;
      default:
        return reachableCells.has(key) ? COLORS.cellReachable : COLORS.cellEmpty;
    }
  };

  const getCellStroke = (cellValue: number, row: number, col: number) => {
    const isSelected =
      selectedViking && selectedViking[0] === row && selectedViking[1] === col;
    if (isSelected) return COLORS.cellSelectedStroke;

    switch (cellValue) {
      case CellValue.WhiteViking:
        return COLORS.whiteVikingStroke;
      case CellValue.RedViking:
        return COLORS.redVikingStroke;
      case CellValue.Runestone:
        return COLORS.runestoneStroke;
      default:
        return reachableCells.has(`${row},${col}`)
          ? COLORS.cellReachableStroke
          : COLORS.cellEmptyStroke;
    }
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

  // ─── SVG icon helpers ────────────────────────────────────

  const renderViking = (cx: number, cy: number, color: "white" | "red") => {
    const fill = color === "white" ? "#ffffff" : "#ff4d4d";
    const stroke = color === "white" ? "#aaaaaa" : "#cc3333";
    const r = HEX_SIZE * 0.32;
    return (
      <g style={{ pointerEvents: "none" }}>
        {/* Shield body */}
        <path
          d={`M ${cx} ${cy - r * 1.1}
              C ${cx + r * 1.2} ${cy - r * 1.1}, ${cx + r * 1.2} ${cy + r * 0.3}, ${cx} ${cy + r * 1.3}
              C ${cx - r * 1.2} ${cy + r * 0.3}, ${cx - r * 1.2} ${cy - r * 1.1}, ${cx} ${cy - r * 1.1} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
        {/* Shield cross */}
        <line x1={cx} y1={cy - r * 0.8} x2={cx} y2={cy + r * 1.0} stroke={stroke} strokeWidth={1} />
        <line x1={cx - r * 0.8} y1={cy - r * 0.1} x2={cx + r * 0.8} y2={cy - r * 0.1} stroke={stroke} strokeWidth={1} />
      </g>
    );
  };

  const renderRunestone = (cx: number, cy: number) => {
    const s = HEX_SIZE * 0.3;
    return (
      <g style={{ pointerEvents: "none" }}>
        <polygon
          points={`${cx},${cy - s * 1.2} ${cx + s * 0.9},${cy} ${cx},${cy + s * 1.2} ${cx - s * 0.9},${cy}`}
          fill="#888888"
          stroke="#aaaaaa"
          strokeWidth={1.2}
        />
        {/* Rune mark */}
        <line x1={cx} y1={cy - s * 0.6} x2={cx} y2={cy + s * 0.6} stroke="#cccccc" strokeWidth={1.2} />
        <line x1={cx - s * 0.35} y1={cy - s * 0.2} x2={cx + s * 0.35} y2={cy + s * 0.2} stroke="#cccccc" strokeWidth={1} />
      </g>
    );
  };

  // ─── SVG hex rendering ─────────────────────────────────
  // Render in two passes: base cells first, then highlighted cells on top
  // so their strokes are fully visible on all edges.

  const baseCells: React.ReactNode[] = [];
  const highlightedCells: React.ReactNode[] = [];

  board.forEach((row, rowI) =>
    row.forEach((cell, colI) => {
      const { x, y } = hexToPixel(rowI, colI);
      const key = `${rowI},${colI}`;
      const isReachable = reachableCells.has(key);
      const isSelected =
        selectedViking && selectedViking[0] === rowI && selectedViking[1] === colI;

      const node = (
        <g key={key} onClick={() => handleCellClick(rowI, colI)}>
          <polygon
            points={hexPoints(x, y)}
            fill={getCellFill(cell, rowI, colI)}
            stroke={getCellStroke(cell, rowI, colI)}
            strokeWidth={isReachable || isSelected ? 2 : 1.5}
            style={{ cursor: getCellCursor(cell, rowI, colI) }}
          />
          {(cell === CellValue.WhiteViking || cell === CellValue.RedViking) &&
            renderViking(x, y, cell === CellValue.WhiteViking ? "white" : "red")}
          {cell === CellValue.Runestone && renderRunestone(x, y)}
        </g>
      );

      if (isReachable || isSelected) {
        highlightedCells.push(node);
      } else {
        baseCells.push(node);
      }
    }),
  );

  // ─── Panel content by state ────────────────────────────

  const iAmWinner = won === myColor;

  const renderBadge = () => {
    if (isGameOver) {
      return iAmWinner ? (
        <div className={cn(styles.badge, styles.badge_success)}>
          <span>✓</span>
          <span>ПОБЕДА</span>
        </div>
      ) : (
        <div className={cn(styles.badge, styles.badge_error)}>
          <span>✗</span>
          <span>ПОРАЖЕНИЕ</span>
        </div>
      );
    }

    if (isWaiting) {
      return (
        <div className={cn(styles.badge, styles.badge_primary)}>
          <span>◐</span>
          <span>ОЖИДАНИЕ</span>
        </div>
      );
    }

    if (isOpponentTurn) {
      return (
        <div className={cn(styles.badge, styles.badge_primary)}>
          <span>◐</span>
          <span>ХОД СОПЕРНИКА</span>
        </div>
      );
    }

    return (
      <div className={cn(styles.badge, styles.badge_success)}>
        <span>●</span>
        <span>ВАШ ХОД</span>
      </div>
    );
  };

  const renderTitle = () => {
    if (isGameOver) {
      return (
        <div className={iAmWinner ? styles.title_victory : styles.title_defeat}>
          {iAmWinner ? "Вы победили!" : "Вы проиграли"}
        </div>
      );
    }

    if (isWaiting) return <div className={styles.title}>Ожидание соперника...</div>;
    if (isOpponentTurn) return <div className={styles.title}>Ход соперника</div>;

    if (phase === TurnPhase.MoveViking) {
      return <div className={styles.title}>Выберите викинга и передвиньте его</div>;
    }

    return <div className={styles.title}>Поставьте рунный камень</div>;
  };

  const renderSubtitle = () => {
    if (isGameOver) return null;

    if (isWaiting) return null;

    if (isOpponentTurn) {
      return <div className={styles.subtitle}>Ожидайте, соперник думает...</div>;
    }

    if (phase === TurnPhase.MoveViking) {
      return (
        <div className={styles.subtitle}>
          {selectedViking
            ? "Нажмите на подсвеченную клетку для хода"
            : "Нажмите на своего кочующего викинга"}
        </div>
      );
    }

    if (phase === TurnPhase.PlaceRunestone) {
      return <div className={styles.subtitle}>Нажмите на подсвеченную клетку</div>;
    }

    return null;
  };

  const renderScores = () => {
    const myWhite = myColor === PlayerColor.White;

    return (
      <div className={styles.scores}>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>
            <span className={cn(styles.colorDot, styles.colorDot_white)} />
            <span className={styles.scoreName}>Белые</span>
          </span>
          <span
            className={cn(styles.scoreValue, {
              [styles.scoreValue_highlight]: isGameOver && (myWhite ? iAmWinner : !iAmWinner),
            })}
          >
            {whiteScore}
          </span>
        </div>
        <div className={styles.scoreRow}>
          <span className={styles.scoreLabel}>
            <span className={cn(styles.colorDot, styles.colorDot_red)} />
            <span className={styles.scoreName}>Красные</span>
          </span>
          <span
            className={cn(styles.scoreValue, {
              [styles.scoreValue_highlight]: isGameOver && (!myWhite ? iAmWinner : !iAmWinner),
            })}
          >
            {redScore}
          </span>
        </div>
      </div>
    );
  };

  const renderBigScore = () => {
    if (!isGameOver) return null;

    const myScore = myColor === PlayerColor.White ? whiteScore : redScore;
    const opponentScore = myColor === PlayerColor.White ? redScore : whiteScore;

    return (
      <div className={styles.bigScore}>
        <span className={cn(styles.bigScoreNumber, styles.bigScoreNumber_winner)}>
          {myScore}
        </span>
        <span className={styles.bigScoreSeparator}>:</span>
        <span className={cn(styles.bigScoreNumber, styles.bigScoreNumber_loser)}>
          {opponentScore}
        </span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.boardContainer}>
        <svg
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        >
          {baseCells}
          {highlightedCells}
        </svg>
      </div>

      <div className={styles.panel}>
        {renderBadge()}
        {renderTitle()}

        {isWaiting && (
          <div className={styles.loadingDots}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
          </div>
        )}

        {renderSubtitle()}

        <div className={styles.divider} />

        {renderBigScore()}

        {renderScores()}

        {isMyTurn && phase === TurnPhase.PlaceRunestone && (
          <>
            <div className={styles.divider} />
            <button className={styles.cancelBtn} onClick={handleCancelMove}>
              Отменить ход
            </button>
          </>
        )}

        {canSkip && isMyTurn && (
          <>
            <div className={styles.divider} />
            <Button className={styles.newGameBtn} onClick={handleSkip}>
              Пропустить ход
            </Button>
          </>
        )}

        {isGameOver && (
          <>
            <div className={styles.divider} />
            <Button className={styles.newGameBtn} isLoading={isLoading} onClick={handleNewGame}>
              Новая игра
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Ragnarocks;
