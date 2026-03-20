import type { ReactNode } from "react";
import styles from "./Panel.module.scss";
import cn from "classnames";

interface Props {
  children: ReactNode;
  className?: string;
}

export const Panel = ({ className, ...props }: Props) => {
  return <div className={cn(styles.panel, className)} {...props} />;
};
