import styles from "./Go.module.scss";
import cn from "classnames";
import {
  BoardSize,
  type GameState,
  GoMsgType,
  GoServerMsgType,
  Mode,
  StoneColor,
  WinningReason,
} from "src/games/Go/Go.types.ts";
import { HOSHI_POSITIONS, LETTERS_LABELS } from "src/games/Go/Go.constants.ts";
import type { GameProps } from "src/types/gameProps.ts";
import { Stone } from "src/games/Go/components/Stone/Stone.tsx";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { createGoMsg, getOppositeColor } from "src/games/Go/Go.utils.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai/index";
import { userAtom } from "src/store/user.ts";
import { SidePanel } from "src/games/Go/components/SidePanel/SidePanel.tsx";
import { WaitingForOpponent } from "src/games/Go/components/WaitingForOpponent/WaitingForOpponent.tsx";
import { API } from "src/api";
import { useNavigate } from "react-router-dom";
import { SessionStatus } from "src/types/session.ts";
import { GameOverPanel } from "src/games/Go/components/GameOverPanel/GameOverPanel.tsx";
import { Popup } from "src/components/ui/Popup/Popup.tsx";
import { Button } from "src/components/ui/Button/Button.tsx";
import { WarningIcon } from "src/components/icons/WarningIcon.tsx";

const lineGaps = 38;
const lineWidth = 1;

const Go = ({ socket, session, updateGameState, serverMsg }: GameProps<GameState>) => {
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Go);
  const isScoringMode = session.gameState.mode == Mode.Scoring;
  const [isLeaving, setIsLeaving] = useState(false);
  const [isResignPopupOpen, setIsResignPopupOpen] = useState(false);
  const boardSize = session.gameState.board[0].length as BoardSize;
  const boardWidth = boardSize * lineWidth + (boardSize - 1) * lineGaps;

  const territoryBoard = useMemo(() => {
    const territoryBoard: StoneColor[][] = Array.from({ length: boardSize }).map(() => []);
    session.gameState.score.blackTerritory.forEach(([rowI, colI]) => {
      territoryBoard[rowI][colI] = StoneColor.Black;
    });
    session.gameState.score.whiteTerritory.forEach(([rowI, colI]) => {
      territoryBoard[rowI][colI] = StoneColor.White;
    });
    return territoryBoard;
  }, [session.gameState.score]);

  const getDeadStonesBoard = () => {
    const deadStonesBoard: StoneColor[][] = Array.from({ length: boardSize }).map(() => []);
    session.gameState.score.blackDeadStones.forEach(([rowI, colI]) => {
      deadStonesBoard[rowI][colI] = StoneColor.Black;
    });
    session.gameState.score.whiteDeadStones.forEach(([rowI, colI]) => {
      deadStonesBoard[rowI][colI] = StoneColor.White;
    });
    return deadStonesBoard;
  };

  const deadStonesBoard = getDeadStonesBoard();

  useEffect(() => {
    if (!serverMsg) {
      return;
    }

    switch (serverMsg.type) {
      case GoServerMsgType.ScoringCanceled:
        return handleScoringCanceled();
      case GoServerMsgType.Resigned:
        return handleResigned(serverMsg.payload);
    }
  }, [serverMsg]);

  const handleResigned = (color: StoneColor) => {
    session.gameState.won = getOppositeColor(color);
    session.gameState.winningReason = WinningReason.Resignation;
    updateGameState(session.gameState);
  };

  const handleScoringCanceled = () => {
    session.gameState.mode = Mode.Playing;
    session.gameState.blackApprovedScore = false;
    session.gameState.whiteApprovedScore = false;
    updateGameState(session.gameState);
  };

  const amICreator = useMemo(() => {
    const creator = session.participants.find((p) => p.role === ParticipantRole.Creator);
    return user?.id === creator?.userId;
  }, [session.participants, user?.id]);

  const myStonesColor = amICreator
    ? session.gameState.creatorColor
    : getOppositeColor(session.gameState.creatorColor);

  const isMyTurn = session.gameState.currentTurn === myStonesColor;

  const placeStone = (row: number, col: number) => {
    if (!isMyTurn || session.gameState.board[row][col]) return;
    const message = createGoMsg(GoMsgType.PlaceStone, [row, col]);
    sendGameMsg(message);
  };

  const toggleStonesAsEaten = (row: number, col: number) => {
    const message = createGoMsg(GoMsgType.ToggleEaten, [row, col]);
    sendGameMsg(message);
  };

  const onLeaveSessionClick = () => {
    setIsLeaving(true);

    API.sessions
      .delete(session.id)()
      .then(() => navigate("/games"))
      .finally(() => setIsLeaving(false));
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    const message = createGoMsg(GoMsgType.Pass);
    sendGameMsg(message);
  };

  const handleResign = () => {
    const message = createGoMsg(GoMsgType.Resign);
    sendGameMsg(message);
    setIsResignPopupOpen(false);
  };

  const cancelScoringMode = () => {
    const message = createGoMsg(GoMsgType.CancelScoring);
    sendGameMsg(message);
  };

  const approveScore = () => {
    const message = createGoMsg(GoMsgType.ApproveScore);
    sendGameMsg(message);
  };

  const lines = Array.from({ length: boardSize }).map((_, i) => {
    return (
      <Fragment key={i}>
        <div className={styles.line} style={{ top: i * (lineGaps + lineWidth) }} />
        <div
          className={cn(styles.line, styles.line_vertical)}
          style={{ left: `calc(-50% + ${i * (lineGaps + lineWidth)}px)` }}
        />
      </Fragment>
    );
  });

  const stones = session.gameState.board.map((row, rowI) => {
    return row.map((color, colI) => {
      const top = rowI * lineGaps + rowI * lineWidth - 19;
      const left = colI * lineGaps + colI * lineWidth - 19;

      if (!color && !isMyTurn) {
        return null;
      }

      if (!color && isScoringMode) {
        return null;
      }

      if (!color && session.gameState.winningReason) {
        return null;
      }

      const isLastPlaced = Boolean(
        session.gameState.lastStonePlaced &&
          rowI === session.gameState.lastStonePlaced[0] &&
          colI === session.gameState.lastStonePlaced[1]
      );

      const isDeadStone = Boolean(deadStonesBoard[rowI][colI]);

      const classes = cn(
        styles.stone,
        { [styles.hiddenStone]: !color },
        { [styles.deadStone]: isDeadStone }
      );

      return (
        <Stone
          key={`${rowI}-${colI}`}
          style={{ top, left }}
          className={classes}
          color={color || session.gameState.currentTurn}
          onClick={() => (isScoringMode ? toggleStonesAsEaten(rowI, colI) : placeStone(rowI, colI))}
          isLastPlaced={isLastPlaced}
          isScoringMode={isScoringMode}
          isGaveOver={session.status === SessionStatus.Completed}
        />
      );
    });
  });

  const numbers = Array.from({ length: boardSize }).map((_, i) => {
    const bottom = i * lineGaps + i * lineWidth - 9;
    return (
      <Fragment key={i}>
        <div style={{ bottom }} className={cn(styles.number, styles.number_left)}>
          {i + 1}
        </div>
        <div style={{ bottom }} className={cn(styles.number, styles.number_right)}>
          {i + 1}
        </div>
      </Fragment>
    );
  });

  const letters = Array.from({ length: boardSize }).map((_, i) => {
    const left = i * lineGaps + i * lineWidth - 9;
    return (
      <Fragment key={i}>
        <div style={{ left }} className={cn(styles.letter, styles.letter_top)}>
          {LETTERS_LABELS[i]}
        </div>
        <div style={{ left }} className={cn(styles.letter, styles.letter_bottom)}>
          {LETTERS_LABELS[i]}
        </div>
      </Fragment>
    );
  });

  const hoshi = HOSHI_POSITIONS[boardSize].map(([rowI, colI]) => {
    const top = rowI * lineGaps + rowI * lineWidth - 3;
    const left = colI * lineGaps + colI * lineWidth - 3;
    return <div key={`${rowI}-${colI}`} style={{ top, left }} className={styles.hoshi} />;
  });

  const territoryMarks =
    isScoringMode &&
    [...session.gameState.score.whiteTerritory, ...session.gameState.score.blackTerritory].map(
      ([rowI, colI]) => {
        const top = rowI * lineGaps + rowI * lineWidth - 6;
        const left = colI * lineGaps + colI * lineWidth - 6;
        const color = territoryBoard[rowI][colI];

        if (!color) {
          return null;
        }

        const classes = cn(styles.territoryMark, {
          [styles.black]: color === StoneColor.Black,
          [styles.white]: color === StoneColor.White,
        });

        return <div key={`${rowI}-${colI}`} style={{ top, left }} className={classes} />;
      }
    );

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
            {territoryMarks}
          </div>
        </div>
      </div>

      {session.status !== SessionStatus.Completed && (
        <>
          {session.participants.length === 1 ? (
            <WaitingForOpponent
              inviteLink={`${window.location.origin}/play/${GameSlug.Go}/${session.id}`}
              onLeave={onLeaveSessionClick}
              isLeaving={isLeaving}
            />
          ) : (
            <SidePanel
              session={session}
              handlePass={handlePass}
              handleResign={() => setIsResignPopupOpen(true)}
              cancelScoringMode={cancelScoringMode}
              isMyTurn={isMyTurn}
              myStonesColor={myStonesColor}
              approveScore={approveScore}
            />
          )}
        </>
      )}

      {session.status === SessionStatus.Completed && <GameOverPanel session={session} />}

      <Popup
        isOpen={isResignPopupOpen}
        onClose={() => setIsResignPopupOpen(false)}
        title="Вы уверены, что хотите сдаться?"
      >
        <div className={styles.resignContent}>
          <WarningIcon className={styles.icon} />
          <p className={styles.description}>
            Это действие нельзя будет отменить. Игра немедленно завершится, и победа будет
            присуждена вашему сопернику.
          </p>
          <div className={styles.buttons}>
            <Button variant="secondary" onClick={() => setIsResignPopupOpen(false)}>
              Отмена
            </Button>

            <Button variant="danger" onClick={handleResign}>
              Подтвердить сдачу
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default Go;
