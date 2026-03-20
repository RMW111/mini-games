import type { ReactNode } from "react";
import styles from "./GameLayout.module.scss";
import cn from "classnames";

interface Props {
  children: ReactNode;
  className?: string;
}

export const GameLayout = ({ className, ...props }: Props) => {
  return <div className={cn(styles.gameLayout, className)} {...props} />;
};
