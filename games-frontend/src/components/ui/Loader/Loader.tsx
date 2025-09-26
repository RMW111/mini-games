import styles from "./Loader.module.scss";

interface LoaderProps {
  text?: string;
}

export const Loader = ({ text = "Загрузка..." }: LoaderProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}></div>
      <p className={styles.text}>{text}</p>
    </div>
  );
};
