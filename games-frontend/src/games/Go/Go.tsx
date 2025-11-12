import styles from "./Go.module.scss";
import cn from "classnames";
import { BoardSize, type GameState, GoMsgType, GoServerMsgType } from "src/games/Go/Go.types.ts";
import { HOSHI_POSITIONS, LETTERS_LABELS } from "src/games/Go/Go.constants.ts";
import type { GameProps } from "src/types/gameProps.ts";
import { Stone } from "src/games/Go/components/Stone/Stone.tsx";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { createGoMsg, getOppositeColor } from "src/games/Go/Go.utils.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { Fragment, useEffect, useMemo } from "react";
import { useAtom } from "jotai/index";
import { userAtom } from "src/store/user.ts";
import { Button } from "src/components/ui/Button/Button.tsx";

const lineGaps = 38;
const lineWidth = 1;

const Go = ({ socket, session, updateGameState, serverMsg }: GameProps<GameState>) => {
  const [user] = useAtom(userAtom);
  const { sendGameMsg } = useSessionWS(socket.current, GameSlug.Go);

  useEffect(() => {
    if (!serverMsg) {
      return;
    }

    switch (serverMsg.type) {
      case GoServerMsgType.Passed:
        return handlePassedMsg();
    }
  }, [serverMsg]);

  const handlePassedMsg = () => {
    session.gameState.lastMoveWasPass = true;
    changeTurn();
    updateGameState(session.gameState);
  };

  const changeTurn = () => {
    session.gameState.currentTurn = getOppositeColor(session.gameState.currentTurn);
  };

  const boardSize = session.gameState.board[0].length as BoardSize;
  const boardWidth = boardSize * lineWidth + (boardSize - 1) * lineGaps;

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

  const handlePassTurn = () => {
    if (!isMyTurn) return;
    const message = createGoMsg(GoMsgType.Pass);
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

      const isLastPlaced = Boolean(
        session.gameState.lastStonePlaced &&
          rowI === session.gameState.lastStonePlaced[0] &&
          colI === session.gameState.lastStonePlaced[1]
      );

      return (
        <Stone
          key={`${rowI}-${colI}`}
          style={{ top, left }}
          className={cn(styles.stone, { [styles.hiddenStone]: !color })}
          color={color || session.gameState.currentTurn}
          onClick={() => placeStone(rowI, colI)}
          isLastPlaced={isLastPlaced}
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

      <div className={styles.uiPanel}>
        <div className={styles.turnIndicator}>
          {isMyTurn ? (
            <span className={styles.myTurn}>Ваш ход</span>
          ) : (
            <span className={styles.opponentTurn}>Ход противника</span>
          )}
        </div>

        {session.gameState.lastMoveWasPass && isMyTurn && (
          <div className={styles.passIndicator}>Противник спасовал</div>
        )}

        <div className={styles.actions}>
          <Button onClick={handlePassTurn} isDisabled={!isMyTurn}>
            Пас
          </Button>
        </div>

        <div className={styles.scoreSection}>
          <div className={styles.scoreLine}>
            <span>Пленено Черных:</span>
            <span>{session.gameState.score.blackCaptured}</span>
          </div>
          <div className={styles.scoreLine}>
            <span>Пленено Белых:</span>
            <span>{session.gameState.score.whiteCaptured}</span>
          </div>

          <div className={cn(styles.scoreLine, styles.komiInfo)}>
            <span>Коми:</span>
            <span>+6.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Go;
