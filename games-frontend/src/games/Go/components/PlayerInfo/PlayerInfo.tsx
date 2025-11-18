import styles from "./PlayerInfo.module.scss";
import cn from "classnames";
import { StoneColor } from "src/games/Go/Go.types.ts";

interface PlayerInfoProps {
  name: string;
  avatarUrl: string;
  color: StoneColor;
  capturedCount: number;
  komi?: number;
  isActive: boolean;
  isScoringMode: boolean;
  totalScore: number;
}

export const PlayerInfo = ({
  name,
  avatarUrl,
  color,
  capturedCount,
  komi,
  isActive,
  isScoringMode,
  totalScore,
}: PlayerInfoProps) => {
  return (
    <div className={cn(styles.playerInfo, { [styles.active]: isActive })} title={name}>
      <div className={styles.avatarContainer}>
        <div
          className={cn(
            styles.stoneIndicator,
            styles[color === StoneColor.White ? "white" : "black"]
          )}
        />
        <img src={avatarUrl} alt={name} className={styles.avatar} />
      </div>

      <div className={styles.textInfo}>
        <h3 className={styles.playerName}>{name}</h3>

        {isScoringMode ? (
          <p className={styles.stats}>{totalScore} очков</p>
        ) : (
          <p className={styles.stats}>
            {capturedCount} камней
            {komi && <span className={styles.komi}> + {komi}</span>}
          </p>
        )}
      </div>
    </div>
  );
};
