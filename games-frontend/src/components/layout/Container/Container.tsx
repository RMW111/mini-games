import type { ReactNode } from "react";
import styles from "./Container.module.scss";
import cn from "classnames";

interface Props {
  children: ReactNode;
  className?: string;
}

export const Container = ({ className, ...props }: Props) => {
  return <div className={cn(styles.container, className)} {...props} />;
};
