import styles from "./Ragnarocks.module.scss";
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
import HexBoard from "./components/HexBoard.tsx";
import GamePanel from "./components/GamePanel.tsx";

const Ragnarocks = ({ socket, session }: GameProps<GameState>) => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Ragnarocks);
  const [selectedViking, setSelectedViking] = useState<[number, number] | null>(null);

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
    sendGameMsg(createRagnarocksMsg(RagnarocksMsgType.CancelMove));
  };

  const handleSkip = () => {
    sendGameMsg(createRagnarocksMsg(RagnarocksMsgType.Skip));
  };

  const handleNewGame = () => {
    navigate(`/create-game/${slug}`);
  };

  return (
    <div className={styles.container}>
      <HexBoard
        board={board}
        selectedViking={selectedViking}
        reachableCells={reachableCells}
        isMyTurn={isMyTurn}
        isGameOver={isGameOver}
        phase={phase}
        myVikingValue={myVikingValue}
        onCellClick={handleCellClick}
      />
      <GamePanel
        isGameOver={isGameOver}
        isMyTurn={isMyTurn}
        isWaiting={isWaiting}
        isOpponentTurn={isOpponentTurn}
        iAmWinner={won === myColor}
        phase={phase}
        myColor={myColor}
        whiteScore={whiteScore}
        redScore={redScore}
        canSkip={canSkip}
        selectedViking={selectedViking}
        onCancelMove={handleCancelMove}
        onSkip={handleSkip}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

export default Ragnarocks;
