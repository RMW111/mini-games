import styles from "./Button.module.scss";
import type { HTMLAttributes } from "react";
import cn from "classnames";

interface Props extends HTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button = ({ isLoading, className, children, ...props }: Props) => {
  return (
    <button className={cn(styles.button, className, { [styles.loading]: isLoading })} {...props}>
      {children}
      {isLoading && <span className={styles.spinner} />}
    </button>
  );
};
