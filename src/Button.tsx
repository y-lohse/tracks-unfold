import type { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, type = "button", ...props }: ButtonProps) {
  const classes = className ? `${styles.button} ${className}` : styles.button;

  return <button {...props} className={classes} type={type} />;
}
