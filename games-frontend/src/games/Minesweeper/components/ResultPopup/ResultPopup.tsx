import { Popup } from "src/components/ui/Popup/Popup.tsx";
import styles from "./ResultPopup.module.scss";
import cn from "classnames";
import { useMemo } from "react";
import type { Session } from "src/types/session.ts";
import type { GameState } from "src/games/Minesweeper/Minesweeper.types.ts";
import { Button } from "src/components/ui/Button/Button.tsx";
import { participantsColors } from "src/pages/PlayPage/PlayPage.constants.tsx";

interface Props {
  isOpened: boolean;
  isLoading: boolean;
  onClose: () => void;
  onNewGameClick: () => void;
  session: Session<GameState>;
}

export const ResultPopup = ({ isLoading, isOpened, session, onNewGameClick, onClose }: Props) => {
  const isExploded = session.gameState.board.exploded;

  const participantIds = useMemo(() => {
    const ids = new Set(
      session.gameState.board.grid.flatMap((x) =>
        x.filter((x) => x.flaggedBy).map((x) => x.flaggedBy)
      )
    );
    Object.keys(session.gameState.stats).forEach((userId) => ids.add(userId));
    return Array.from(ids);
  }, [session]);

  const getUserName = (id: string) => {
    const participant = session.participants.find((x) => x.userId === id);
    return participant?.email || id;
  };

  const { opened, defused, mistakes, whoExploded, explodedPlayerColor } = useMemo(() => {
    const opened = participantIds
      .map((id) => {
        const value = session.gameState.stats[id]?.cellsOpened || 0;
        const name = getUserName(id);
        return { name, value };
      })
      .sort((a, b) => b.value - a.value);

    const defused = participantIds
      .map((id) => {
        const value = session.gameState.board.grid.reduce((acc, row) => {
          const rowDefused = row.reduce((acc, cell) => {
            return cell.hasMine && cell.flaggedBy === id ? acc + 1 : acc;
          }, 0);
          return acc + rowDefused;
        }, 0);
        const name = getUserName(id);
        return { name, value };
      })
      .sort((a, b) => b.value - a.value);

    const mistakes = participantIds
      .map((id) => {
        const value = session.gameState.board.grid.reduce((acc, row) => {
          const rowMistakes = row.reduce((acc, cell) => {
            return !cell.hasMine && cell.flaggedBy === id ? acc + 1 : acc;
          }, 0);
          return acc + rowMistakes;
        }, 0);
        const name = getUserName(id);
        return { name, value };
      })
      .sort((a, b) => b.value - a.value);

    const explodedId = Object.keys(session.gameState.stats).find((id) => {
      return session.gameState.stats[id].exploded;
    });
    const whoExploded = explodedId ? getUserName(explodedId) : "";

    const participantIndex = session.participants.findIndex((x) => x.userId === explodedId);

    const explodedPlayerColor =
      participantIndex > -1 ? participantsColors[participantIndex] : participantsColors[0];

    return { opened, defused, mistakes, whoExploded, explodedPlayerColor };
  }, [session]);

  const isThereMistakes = mistakes.some((mistake) => {
    return mistake.value;
  }, 0);

  const getRankContent = (index: number) => {
    const rankClasses = cn(styles.rank, {
      [styles.rank1]: index === 0,
      [styles.rank2]: index === 1,
      [styles.rank3]: index === 2,
    });

    if (index === 0) return <span className={rankClasses}>🥇</span>;
    if (index === 1) return <span className={rankClasses}>🥈</span>;
    if (index === 2) return <span className={rankClasses}>🥉</span>;
    return <span className={rankClasses}>{index + 1}.</span>;
  };

  return (
    <Popup isOpen={isOpened} onClose={onClose} title={"Результаты"}>
      <div className={styles.gameOverPopup}>
        <h2
          className={cn(styles.popupTitle, {
            [styles.winTitle]: !isExploded,
            [styles.lossTitle]: isExploded,
          })}
        >
          {isExploded ? (
            <>
              💥 Игрок <strong style={{ color: explodedPlayerColor }}>{whoExploded}</strong>{" "}
              подорвался на мине
            </>
          ) : (
            "Ура, поле разминировано 🎉"
          )}
        </h2>

        <div className={styles.statsContainer}>
          <div className={styles.statBlock}>
            <h3 className={styles.statTitle}>Открыто клеток</h3>
            <ol className={styles.statList}>
              {opened.map((player, index) => (
                <li key={player.name} className={styles.statItem}>
                  {getRankContent(index)}
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={styles.statValue}>{player.value}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.statBlock}>
            <h3 className={styles.statTitle}>Разминировано мин</h3>
            <ol className={styles.statList}>
              {defused.map((player, index) => (
                <li key={player.name} className={styles.statItem}>
                  {getRankContent(index)}
                  <span className={styles.playerName}>{player.name}</span>
                  <span className={styles.statValue}>{player.value}</span>
                </li>
              ))}
            </ol>
          </div>

          {isThereMistakes && (
            <div className={styles.statBlock}>
              <h3 className={styles.statTitle}>Ошибочные флаги</h3>

              <ol className={styles.statList}>
                {mistakes.map((player, index) => (
                  <li key={player.name} className={styles.statItem}>
                    {getRankContent(index)}
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.statValue}>{player.value}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <Button isLoading={isLoading} className={styles.button} onClick={onNewGameClick}>
          Новая игра
        </Button>
      </div>
    </Popup>
  );
};
