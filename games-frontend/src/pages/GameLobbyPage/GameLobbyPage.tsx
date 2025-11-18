import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "src/api";
import styles from "./GameLobbyPage.module.scss";
import { type GameInfo, GameSlug } from "src/types/game.ts";
import { Popup } from "src/components/ui/Popup/Popup.tsx";
import { needAdditionalPrepGames } from "src/pages/GameLobbyPage/GameLobbyPage.constants.ts";

export const GameLobbyPage = () => {
  const { slug } = useParams<{ slug: GameSlug }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [startingGame, setStartingGame] = useState(false);

  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitiing] = useState(false);

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
    if (startingGame) return;

    if (needAdditionalPrepGames.has(slug!)) {
      navigate(`/create-game/${slug}`);
    } else {
      setStartingGame(true);
      API.sessions
        .createNew({ slug: slug! })
        .then(({ sessionId }) => {
          navigate(`/play/${slug}/${sessionId}`);
        })
        .catch(() => setStartingGame(false));
    }
  };

  const handleJoinSession = (event: FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!sessionIdInput.trim()) {
      setJoinError("ID сессии не может быть пустым.");
      return;
    }
    setJoinError(null);
    setErrorStatus(null);
    setIsSubmitiing(true);

    API.sessions
      .join(sessionIdInput.trim())()
      .then(() => navigate(`/play/${game!.slug}/${sessionIdInput.trim()}`))
      .catch((err) => {
        setErrorStatus(err.status);
        setJoinError(err.message || "Произошла неизвестная ошибка.");
      })
      .finally(() => setIsSubmitiing(false));
  };

  const openJoinModal = () => {
    setSessionIdInput("");
    setJoinError(null);
    setErrorStatus(null);
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
            {startingGame ? "Создаём игру..." : "Начать новую игру"}
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
          {joinError && errorStatus !== 409 && <div className={styles.modalError}>{joinError}</div>}
          {errorStatus === 409 && <div className={styles.modalError}>Сессия заполнена!</div>}

          <button type="submit" className={`${styles.actionButton} ${styles.modalButton}`}>
            {isSubmitting ? "Соединяем..." : "Присоединиться"}
          </button>
        </form>
      </Popup>
    </div>
  );
};
