import { useState } from "react";
import { CreateGameLayout } from "src/components/layout/CreateGameLayout/CreateGameLayout.tsx";
import { Button } from "src/components/ui/Button/Button.tsx";
import styles from "./CreateGoGamePage.module.scss";
import { API } from "src/api";
import { useNavigate } from "react-router-dom";
import { GameSlug } from "src/types/game.ts";
import { StoneColor } from "src/games/Go/Go.types.ts";
import cn from "classnames";
import { BOARD_SIZES } from "src/games/Go/Go.constants.ts";

const PLAYER_COLORS: { value: StoneColor; label: string }[] = [
  { value: StoneColor.Black, label: "Чёрные" },
  { value: StoneColor.White, label: "Белые" },
];

export const CreateGoGamePage = () => {
  const navigate = useNavigate();
  const [boardSize, setBoardSize] = useState<number>(9);
  const [selectedColor, setSelectedColor] = useState<StoneColor>(StoneColor.Black);
  const [isGameCreating, setIsGameCreating] = useState(false);

  const handleCreateGame = () => {
    setIsGameCreating(true);
    const creationData = {
      boardSize,
      color: selectedColor,
    };
    API.sessions
      .createNew({ slug: GameSlug.Go, creationData })
      .then(({ sessionId }) => {
        navigate(`/play/${GameSlug.Go}/${sessionId}`, { replace: true });
      })
      .finally(() => setIsGameCreating(false));
  };

  return (
    <CreateGameLayout
      title="Создание игры 'Го'"
      description="Выберите размер доски и цвет камней для начала новой партии."
    >
      <div className={styles.settingsContainer}>
        {/* === Выбор размера доски (без изменений) === */}
        <div className={styles.optionGroup}>
          <label className={styles.label}>Размер доски:</label>
          <div className={styles.buttonGroup}>
            {BOARD_SIZES.map((size) => (
              <button
                key={size}
                className={cn(styles.optionButton, { [styles.active]: boardSize === size })}
                onClick={() => setBoardSize(size)}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>
        {/* 4. === Новый блок для выбора цвета камней === */}
        <div className={styles.optionGroup}>
          <label className={styles.label}>Ваш цвет:</label>
          <div className={styles.buttonGroup}>
            {PLAYER_COLORS.map(({ value, label }) => (
              <button
                key={value}
                className={cn(styles.colorButton, styles[value === 1 ? "black" : "white"], {
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
