import styles from "./SidePanel.module.scss";
import { Button } from "src/components/ui/Button/Button.tsx";
import { PlayerInfo } from "src/games/Go/components/PlayerInfo/PlayerInfo.tsx";
import { CheckIcon } from "src/components/icons/CheckIcon.tsx";
import { CrossIcon } from "src/components/icons/CrossIcon.tsx";
import type { Session } from "src/types/session.ts";
import { type GameState, Mode, StoneColor } from "src/games/Go/Go.types.ts";
import { ParticipantRole } from "src/types/participant.ts";
import { getOppositeColor } from "src/games/Go/Go.utils.ts";

interface SidePanelProps {
  session: Session<GameState>;
  isMyTurn: boolean;
  myStonesColor: StoneColor;
  handlePass: () => void;
  handleResign: () => void;
  approveScore: () => void;
  cancelScoringMode: () => void;
}

export const SidePanel = ({
  isMyTurn,
  myStonesColor,
  session,
  handlePass,
  handleResign,
  approveScore,
  cancelScoringMode,
}: SidePanelProps) => {
  const isScoringMode = session.gameState.mode === Mode.Scoring;
  const [player1, player2] = session.participants;

  const getStatusMessage = () => {
    switch (true) {
      case isScoringMode:
        return "Этап снятия мертвых камней";
      case isMyTurn && session.gameState.lastMoveWasPass:
        return "Ваш ход - противник спасовал";
      case isMyTurn:
        return "Ваш ход";
      case !isMyTurn && myStonesColor === StoneColor.White:
        return "Ход чёрных";
      case !isMyTurn && myStonesColor === StoneColor.Black:
        return "Ход белых";
    }
  };

  const player1Color =
    player1.role === ParticipantRole.Creator
      ? session.gameState.creatorColor
      : getOppositeColor(session.gameState.creatorColor);

  const player2Color =
    player2.role === ParticipantRole.Creator
      ? session.gameState.creatorColor
      : getOppositeColor(session.gameState.creatorColor);

  const player1Captured =
    player1Color === StoneColor.White
      ? session.gameState.score.blackCaptured
      : session.gameState.score.whiteCaptured;

  const player2Captured =
    player2Color === StoneColor.White
      ? session.gameState.score.blackCaptured
      : session.gameState.score.whiteCaptured;

  const getTotalScore = (color: StoneColor) => {
    let totalScore = color === StoneColor.White ? 6.5 : 0;

    totalScore +=
      color === StoneColor.White
        ? session.gameState.score.blackCaptured
        : session.gameState.score.whiteCaptured;

    totalScore +=
      color === StoneColor.White
        ? session.gameState.score.whiteTerritory.length
        : session.gameState.score.blackTerritory.length;

    totalScore +=
      color === StoneColor.White
        ? session.gameState.score.blackDeadStones.length
        : session.gameState.score.whiteDeadStones.length;

    return totalScore;
  };

  const isPlayer1ApprovedScore =
    player1Color === StoneColor.White
      ? session.gameState.whiteApprovedScore
      : session.gameState.blackApprovedScore;

  const isPlayer2ApprovedScore =
    player2Color === StoneColor.White
      ? session.gameState.whiteApprovedScore
      : session.gameState.blackApprovedScore;

  return (
    <div className={styles.sidePanel}>
      <div className={styles.playersContainer}>
        <PlayerInfo
          name={player1.email}
          avatarUrl={player1.avatarUrl}
          color={player1Color}
          komi={player1Color === StoneColor.White ? 6.5 : undefined}
          capturedCount={player1Captured}
          isActive={session.gameState.currentTurn === player1Color && !isScoringMode}
          isScoringMode={isScoringMode}
          totalScore={getTotalScore(player1Color)}
        />
        <PlayerInfo
          name={player2.email}
          avatarUrl={player2.avatarUrl}
          color={player2Color}
          capturedCount={player2Captured}
          komi={player2Color === StoneColor.White ? 6.5 : undefined}
          isActive={session.gameState.currentTurn === player2Color && !isScoringMode}
          isScoringMode={isScoringMode}
          totalScore={getTotalScore(player2Color)}
        />
      </div>

      <div className={styles.mainActions}>
        <Button isDisabled={isScoringMode || !isMyTurn} onClick={handlePass}>
          Пас
        </Button>

        <Button variant="secondary" onClick={handleResign} isDisabled={isScoringMode}>
          Сдаться
        </Button>
      </div>

      <div className={styles.statusMessage}>{getStatusMessage()}</div>

      {isScoringMode && (
        <div className={styles.scoringPhase}>
          <p className={styles.scoringDescription}>
            <i>
              В этой фазе оба игрока выбирают, какие группы считаются захваченными и должны быть
              убраны для подсчета очков.
            </i>
          </p>

          <Button
            onClick={approveScore}
            isDisabled={
              myStonesColor === StoneColor.White
                ? session.gameState.whiteApprovedScore
                : session.gameState.blackApprovedScore
            }
          >
            Согласиться со статусом камней
          </Button>

          <div className={styles.agreementStatus}>
            <div className={styles.agreementItem}>
              {isPlayer1ApprovedScore ? (
                <CheckIcon className={styles.iconCheck} />
              ) : (
                <CrossIcon className={styles.iconCross} />
              )}
              <span>{player1.email}</span>
            </div>

            <div className={styles.agreementItem}>
              {isPlayer2ApprovedScore ? (
                <CheckIcon className={styles.iconCheck} />
              ) : (
                <CrossIcon className={styles.iconCross} />
              )}
              <span>{player2.email}</span>
            </div>
          </div>

          <div className={styles.resumeButtonContainer}>
            <Button variant="secondary" onClick={cancelScoringMode}>
              Отменить и возобновить партию
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
