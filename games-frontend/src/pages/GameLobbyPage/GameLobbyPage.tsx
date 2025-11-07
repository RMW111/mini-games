import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "src/api";
import styles from "./GameLobbyPage.module.scss";
import type { GameInfo } from "src/types/game.ts";
import { Popup } from "src/components/ui/Popup/Popup.tsx";

export const GameLobbyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    API.games
      .getBySlug(slug!)()
      .then(setGame)
      .catch(() => setError("Игра не найдена или произошла ошибка."));
  }, []);

  if (!game) {
    return <div className={styles.status}>Загрузка информации об игре...</div>;
  }

  if (error || !game) {
    return <div className={styles.statusError}>{error || "Игра не найдена."}</div>;
  }

  const handleNewGame = () => {
    API.sessions.createNew({ slug: slug! }).then(({ sessionId }) => {
      navigate(`/play/${game.slug}/${sessionId}`);
    });
  };

  const handleJoinSession = (event: FormEvent) => {
    event.preventDefault();
    if (!sessionIdInput.trim()) {
      setJoinError("ID сессии не может быть пустым.");
      return;
    }
    setJoinError(null);

    API.sessions
      .join(sessionIdInput.trim())()
      .then(() => navigate(`/play/${game!.slug}/${sessionIdInput.trim()}`))
      .catch((err) => setJoinError(err.message || "Произошла неизвестная ошибка."));
  };

  const openJoinModal = () => {
    setSessionIdInput("");
    setJoinError(null);
    setJoinModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.lobby}>
        <div className={styles.gameInfo}>
          <h1 className={styles.gameTitle}>{game.name}</h1>
          <p className={styles.gameDescription}>{game.description}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.actionButton} onClick={handleNewGame}>
            Начать новую игру
          </button>

          <button
            className={`${styles.actionButton} ${styles.secondary}`}
            onClick={() => navigate(`/games/${slug}/continue`)}
          >
            Продолжить игру
          </button>

          <button className={`${styles.actionButton} ${styles.secondary}`} onClick={openJoinModal}>
            Присоединиться к игре
          </button>
        </div>
      </div>

      <Popup
        isOpen={isJoinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Присоединиться к сессии"
      >
        <form className={styles.joinModalContent} onSubmit={handleJoinSession}>
          <p>Введите ID сессии, чтобы присоединиться к существующей игре.</p>
          <input
            type="text"
            className={styles.modalInput}
            placeholder="Например, a1b2c3d4-..."
            value={sessionIdInput}
            onChange={(e) => setSessionIdInput(e.target.value)}
          />
          {joinError && <div className={styles.modalError}>{joinError}</div>}
          <button type="submit" className={`${styles.actionButton} ${styles.modalButton}`}>
            Присоединиться
          </button>
        </form>
      </Popup>
    </div>
  );
};
