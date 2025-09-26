import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "src/api";
import styles from "./GamesPage.module.scss";

import type { GameInfo } from "src/types/game.ts";

export const GamesPage = () => {
  const [games, setGames] = useState<GameInfo[]>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    API.games
      .getAll()
      .then(setGames)
      .catch(() => setError("Не удалось загрузить список игр. Попробуйте позже."));
  }, []);

  const renderContent = () => {
    if (!games) {
      return <div className={styles.loading}>Загрузка игр...</div>;
    }

    if (error) {
      return <div className={styles.error}>{error}</div>;
    }

    if (games.length === 0) {
      return <p>Пока нет доступных игр.</p>;
    }

    return (
      <div className={styles.gamesList}>
        {games.map((game) => (
          <Link to={`/games/${game.slug}`} key={game.id} className={styles.gameCard}>
            <h3 className={styles.gameName}>{game.name}</h3>
            <p className={styles.gameDescription}>{game.description}</p>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Доступные игры</h2>
      {renderContent()}
    </div>
  );
};
