import React, { type CSSProperties } from "react";
import styles from "./Stone.module.scss";
import { StoneColor } from "src/games/Go/Go.types.ts";
import cn from "classnames";

interface StoneProps {
  color: StoneColor;
  isLastPlaced: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Stone: React.FC<StoneProps> = ({
  color,
  style,
  isLastPlaced,
  className = "",
  onClick,
}) => {
  const classes = cn(
    styles.stone,
    styles[color === StoneColor.Black ? "black" : "white"],
    className,
    { [styles.lastPlaced]: isLastPlaced }
  );

  return (
    <div style={style} className={classes} onClick={onClick}>
      {isLastPlaced && <div className={styles.lastMoveMarker} />}
    </div>
  );
};
