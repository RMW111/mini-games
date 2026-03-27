import { useState } from "react";
import { CreateGameLayout } from "src/components/layout/CreateGameLayout/CreateGameLayout.tsx";
import { Button } from "src/components/ui/Button/Button.tsx";
import styles from "./CreateRagnarocksGamePage.module.scss";
import { API } from "src/api";
import { useNavigate } from "react-router-dom";
import { GameSlug } from "src/types/game.ts";
import { PlayerColor } from "src/games/Ragnarocks/Ragnarocks.types.ts";
import cn from "classnames";

enum BoardSize {
  Small = "small",
  Large = "large",
}

const BOARD_SIZES: { value: BoardSize; label: string; description: string }[] = [
  { value: BoardSize.Small, label: "Малое", description: "10 рядов, 3 викинга" },
  { value: BoardSize.Large, label: "Большое", description: "14 рядов, 5 викингов" },
];

const PLAYER_COLORS: { value: PlayerColor; label: string }[] = [
  { value: PlayerColor.White, label: "Белые" },
  { value: PlayerColor.Red, label: "Красные" },
];

enum Opponent {
  Human = "human",
  AI = "ai",
}

export const CreateRagnarocksGamePage = () => {
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState<BoardSize>(BoardSize.Small);
  const [selectedColor, setSelectedColor] = useState<PlayerColor>(PlayerColor.White);
  const [opponent, setOpponent] = useState<Opponent>(Opponent.Human);
  const [isGameCreating, setIsGameCreating] = useState(false);

  const handleCreateGame = () => {
    setIsGameCreating(true);
    const creationData = {
      boardSize,
      color: selectedColor,
      vsAi: opponent === Opponent.AI,
    };
    API.sessions
      .createNew({ slug: GameSlug.Ragnarocks, creationData })
      .then(({ sessionId }) => {
        navigate(`/play/${GameSlug.Ragnarocks}/${sessionId}`, { replace: true });
      })
      .finally(() => setIsGameCreating(false));
  };

  return (
    <CreateGameLayout
      title="Создание игры 'Камни Рагнарёка'"
      description="Выберите размер поля и цвет викингов для начала новой партии."
    >
      <div className={styles.settingsContainer}>
        <div className={styles.optionGroup}>
          <label className={styles.label}>Противник:</label>
          <div className={styles.buttonGroup}>
            <button
              className={cn(styles.optionButton, { [styles.active]: opponent === Opponent.Human })}
              onClick={() => setOpponent(Opponent.Human)}
            >
              <span className={styles.optionLabel}>Человек</span>
            </button>
            <button
              className={cn(styles.optionButton, { [styles.active]: opponent === Opponent.AI })}
              onClick={() => setOpponent(Opponent.AI)}
            >
              <span className={styles.optionLabel}>AI</span>
            </button>
          </div>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.label}>Размер поля:</label>
          <div className={styles.buttonGroup}>
            {BOARD_SIZES.map(({ value, label, description }) => (
              <button
                key={value}
                className={cn(styles.optionButton, { [styles.active]: boardSize === value })}
                onClick={() => setBoardSize(value)}
              >
                <span className={styles.optionLabel}>{label}</span>
                <span className={styles.optionDescription}>{description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.optionGroup}>
          <label className={styles.label}>Ваш цвет:</label>
          <div className={styles.buttonGroup}>
            {PLAYER_COLORS.map(({ value, label }) => (
              <button
                key={value}
                className={cn(styles.colorButton, styles[value === PlayerColor.White ? "white" : "red"], {
                  [styles.active]: selectedColor === value,
                })}
                onClick={() => setSelectedColor(value)}
                title={label}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button isLoading={isGameCreating} onClick={handleCreateGame}>
            Создать игру
          </Button>

          <Button onClick={() => window.history.back()} variant="secondary">
            Отмена
          </Button>
        </div>
      </div>
    </CreateGameLayout>
  );
};
