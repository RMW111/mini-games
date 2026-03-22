import styles from "../Ragnarocks.module.scss";
import cn from "classnames";
import { PlayerColor, TurnPhase } from "src/games/Ragnarocks/Ragnarocks.types.ts";
import { Button } from "src/components/ui/Button/Button.tsx";

interface GamePanelProps {
  isGameOver: boolean;
  isMyTurn: boolean;
  isWaiting: boolean;
  isOpponentTurn: boolean;
  iAmWinner: boolean;
  phase: TurnPhase;
  myColor: PlayerColor;
  whiteScore: number;
  redScore: number;
  canSkip: boolean;
  isLoading: boolean;
  selectedViking: [number, number] | null;
  onCancelMove: () => void;
  onSkip: () => void;
  onNewGame: () => void;
}

const GamePanel = ({
  isGameOver,
  isMyTurn,
  isWaiting,
  isOpponentTurn,
  iAmWinner,
  phase,
  myColor,
  whiteScore,
  redScore,
  canSkip,
  isLoading,
  selectedViking,
  onCancelMove,
  onSkip,
  onNewGame,
}: GamePanelProps) => {
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
    if (isGameOver || isWaiting) return null;

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

  const myWhite = myColor === PlayerColor.White;

  const renderBigScore = () => {
    if (!isGameOver) return null;

    const myScore = myWhite ? whiteScore : redScore;
    const opponentScore = myWhite ? redScore : whiteScore;

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

      {isMyTurn && phase === TurnPhase.PlaceRunestone && (
        <>
          <div className={styles.divider} />
          <button className={styles.cancelBtn} onClick={onCancelMove}>
            Отменить ход
          </button>
        </>
      )}

      {canSkip && isMyTurn && (
        <>
          <div className={styles.divider} />
          <Button className={styles.newGameBtn} onClick={onSkip}>
            Пропустить ход
          </Button>
        </>
      )}

      {isGameOver && (
        <>
          <div className={styles.divider} />
          <Button className={styles.newGameBtn} isLoading={isLoading} onClick={onNewGame}>
            Новая игра
          </Button>
        </>
      )}
    </div>
  );
};

export default GamePanel;
