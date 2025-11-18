import { useState } from "react";
import styles from "./WaitingForOpponent.module.scss";
import { Button } from "src/components/ui/Button/Button.tsx";
import cn from "classnames";
import { CheckIcon } from "src/components/icons/CheckIcon.tsx";
import { CopyIcon } from "src/components/icons/CopyIcon.tsx";

interface WaitingForOpponentProps {
  inviteLink: string;
  isLeaving: boolean;
  onLeave: () => void;
}

export const WaitingForOpponent = ({ inviteLink, isLeaving, onLeave }: WaitingForOpponentProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className={styles.waitingPanel}>
      <h2 className={styles.title}>Ожидание соперника...</h2>
      <p className={styles.description}>
        Отправьте эту ссылку вашему оппоненту, чтобы начать игру.
      </p>

      <div className={styles.inviteContainer}>
        <input
          title={inviteLink}
          type="text"
          value={inviteLink}
          readOnly
          className={styles.inviteInput}
          onClick={(e) => e.currentTarget.select()} // Выделяем текст по клику
        />

        <Button
          className={cn(styles.copyButton, { [styles.copied]: isCopied })}
          onClick={handleCopyLink}
          aria-label={isCopied ? "Ссылка скопирована" : "Копировать ссылку"}
        >
          {isCopied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>

      <div className={styles.leaveAction}>
        <Button variant="secondary" isLoading={isLeaving} onClick={onLeave}>
          Покинуть игру
        </Button>
      </div>
    </div>
  );
};
