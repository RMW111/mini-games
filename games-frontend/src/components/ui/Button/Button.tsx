import styles from "./Button.module.scss";
import type { HTMLAttributes } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";

interface Props extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  isLoading?: boolean;
  href?: string;
  variant?: "primary" | "secondary";
}

export const Button = ({
  href,
  isLoading,
  className,
  children,
  variant = "primary",
  ...props
}: Props) => {
  const classes = cn(styles.button, className, {
    [styles.loading]: isLoading,
    [styles.secondary]: variant === "secondary",
  });

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
