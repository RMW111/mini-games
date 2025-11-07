import type { ReactNode } from "react";
import { type Session, SessionStatus } from "src/types/session.ts";
import styles from "./SessionCard.module.scss";
import { Button } from "src/components/ui/Button/Button";
import { useParams } from "react-router-dom";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusText: Record<SessionStatus, string> = {
  [SessionStatus.Pending]: "Ожидание игроков",
  [SessionStatus.InProgress]: "В процессе",
  [SessionStatus.Completed]: "Завершена",
};

interface SessionCardProps {
  session: Session;
  children?: ReactNode;
}

export const SessionCard = ({ session, children }: SessionCardProps) => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className={styles.sessionCard}>
      <div className={styles.cardHeader}>
        <span className={styles.status} data-status={session.status}>
          {statusText[session.status]}
        </span>
        <span className={styles.participants}>Участников: {session.participants.length}</span>
      </div>

      <div className={styles.cardBody}>
        {children ?? <p className={styles.noGameInfo}>Общая игровая сессия</p>}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.date}>Создана: {formatDate(session.createdAt)}</span>
        <Button href={`/play/${slug}/${session.id}`}>Продолжить</Button>
      </div>
    </div>
  );
};
