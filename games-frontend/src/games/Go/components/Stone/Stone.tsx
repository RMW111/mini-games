import React, { type CSSProperties } from "react";
import styles from "./Stone.module.scss";
import { StoneColor } from "src/games/Go/Go.models.ts";

interface StoneProps {
  color: StoneColor;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const Stone: React.FC<StoneProps> = ({ color, style, className = "", onClick }) => {
  return (
    <div
      style={style}
      className={`${styles.stone} ${styles[color === StoneColor.Black ? "black" : "white"]} ${className}`}
      onClick={onClick}
    />
  );
};
