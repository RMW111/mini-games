import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "src/api";
import styles from "./GamesPage.module.scss";

import type { GameInfo } from "src/types/game.ts";

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
