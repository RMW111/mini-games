import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "src/api";
import styles from "./GamesPage.module.scss";

import type { GameInfo } from "src/types/game.ts";

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const formatPlayers = (maxPlayers: number | null) => {
  if (maxPlayers === null) return "∞ игроков";
  if (maxPlayers === 1) return "1 игрок";
  if (maxPlayers >= 2 && maxPlayers <= 4) return `${maxPlayers} игрока`;
  return `${maxPlayers} игроков`;
};

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
            <div className={styles.cardImage}>
              {game.image_url ? (
                <img src={game.image_url} alt={game.name} />
              ) : (
                <div className={styles.cardImagePlaceholder} />
              )}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>{game.name}</h3>
                <p className={styles.cardDesc}>{game.description}</p>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.metaPlayers}>
                  <UsersIcon />
                  {formatPlayers(game.max_players)}
                </span>
                <span className={styles.playBtn}>
                  ▶ Играть
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Доступные игры</h2>
        <p className={styles.subtitle}>Выберите игру и начните играть с друзьями прямо сейчас</p>
      </div>
      {renderContent()}
      <div className={styles.bottomSection}>
        <div className={styles.divider} />
        <span className={styles.comingSoon}>✨ Новые игры скоро появятся</span>
      </div>
    </div>
  );
};
