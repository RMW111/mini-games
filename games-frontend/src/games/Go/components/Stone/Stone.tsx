import React, { type CSSProperties } from "react";
import styles from "./Stone.module.scss";
import { StoneColor } from "src/games/Go/Go.types.ts";
import cn from "classnames";

interface StoneProps {
  color: StoneColor;
  isLastPlaced: boolean;
  isScoringMode: boolean;
  isGaveOver: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Stone: React.FC<StoneProps> = ({
  color,
  style,
  isLastPlaced,
  isGaveOver,
  isScoringMode,
  className = "",
  onClick,
}) => {
  const classes = cn(
    styles.stone,
    styles[color === StoneColor.Black ? "black" : "white"],
    className,
    { [styles.scoringMode]: isScoringMode && !isGaveOver }
  );

  return (
    <div style={style} className={classes} onClick={onClick}>
      {isLastPlaced && !isScoringMode && <div className={styles.lastMoveMarker} />}
    </div>
  );
};
