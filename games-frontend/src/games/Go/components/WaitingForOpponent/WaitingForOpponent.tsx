import styles from "./WaitingForOpponent.module.scss";
import { Button } from "src/components/ui/Button/Button.tsx";
import { Panel } from "src/components/ui/Panel/Panel.tsx";
import { CopyableInput } from "src/components/ui/CopyableInput/CopyableInput.tsx";

interface WaitingForOpponentProps {
  inviteLink: string;
  isLeaving: boolean;
  onLeave: () => void;
}

export const WaitingForOpponent = ({ inviteLink, isLeaving, onLeave }: WaitingForOpponentProps) => {
  return (
    <Panel className={styles.waitingPanel}>
      <h2 className={styles.title}>Ожидание соперника...</h2>
      <p className={styles.description}>
        Отправьте эту ссылку вашему оппоненту, чтобы начать игру.
      </p>

      <CopyableInput value={inviteLink} />

      <div className={styles.leaveAction}>
        <Button variant="secondary" isLoading={isLeaving} onClick={onLeave}>
          Покинуть игру
        </Button>
      </div>
    </Panel>
  );
};
