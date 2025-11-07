import styles from "./Button.module.scss";
import type { HTMLAttributes } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";

interface Props extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  isLoading?: boolean;
  href?: string;
}

export const Button = ({ href, isLoading, className, children, ...props }: Props) => {
  const classes = cn(styles.button, className, { [styles.loading]: isLoading });

  const content = (
    <>
      {children}
      {isLoading && <span className={styles.spinner} />}
    </>
  );

  if (href) {
    return (
      <Link to={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
};
