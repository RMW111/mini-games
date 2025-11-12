import styles from "./Button.module.scss";
import type { HTMLAttributes } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";

interface Props extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  isLoading?: boolean;
  href?: string;
  variant?: "primary" | "secondary";
  isDisabled?: boolean;
}

export const Button = ({
  href,
  isLoading,
  className,
  children,
  isDisabled,
  variant = "primary",
  ...props
}: Props) => {
  const classes = cn(styles.button, className, {
    [styles.loading]: isLoading,
    [styles.secondary]: variant === "secondary",
    [styles.disabled]: isDisabled,
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
    <button disabled={isDisabled} className={classes} {...props}>
      {content}
    </button>
  );
};
