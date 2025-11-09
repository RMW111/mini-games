import type { ReactNode } from "react";
import styles from "./CreateGameLayout.module.scss";
import { Container } from "src/components/layout/Container/Container.tsx";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export const CreateGameLayout = ({ title, description, children }: Props) => {
  return (
    <Container>
      <div className={styles.createGameLayout}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        {children}
      </div>
    </Container>
  );
};
