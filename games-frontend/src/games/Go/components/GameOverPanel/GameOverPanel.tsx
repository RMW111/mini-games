import styles from "./GameOverPanel.module.scss";
import { Button } from "src/components/ui/Button/Button.tsx";
import { type GameState, StoneColor, WinningReason } from "src/games/Go/Go.types.ts";
import { TrophyIcon } from "src/components/icons/TrophyIcon.tsx";
import { useNavigate } from "react-router-dom";
import { GameSlug } from "src/types/game.ts";
import type { Session } from "src/types/session.ts";

type PlayerData = { name: string; avatarUrl: string };

interface GameOverPanelProps {
  session: Session<GameState>;
  blackPlayer: PlayerData;
  whitePlayer: PlayerData;
}

export const GameOverPanel = ({ session, blackPlayer, whitePlayer }: GameOverPanelProps) => {
  const navigate = useNavigate();

  const territory = {
    black: session.gameState.score.blackTerritory.length,
    white: session.gameState.score.whiteTerritory.length,
  };
  const komi = 6.5;

  const winnerColor = session.gameState.won!;
  const winnerData = winnerColor === StoneColor.Black ? blackPlayer : whitePlayer;

  const blackTotal =
    session.gameState.score.whiteCaptured +
    session.gameState.score.whiteDeadStones.length +
    territory.black;

  const whiteTotal =
    session.gameState.score.blackCaptured +
    session.gameState.score.blackDeadStones.length +
    territory.white +
    komi;

  const scoreDifference = Math.abs(blackTotal - whiteTotal);

  const getOutcomeDetails = () => {
    const winnerName = <strong>{winnerData.name}</strong>;

    switch (session.gameState.winningReason) {
      case WinningReason.Resignation:
        return {
          title: <>{winnerName} победил!</>,
          description: "Соперник сдался.",
        };
      case WinningReason.Timeout:
        return {
          title: <>{winnerName} победил!</>,
          description: "У соперника закончилось время.",
        };
      case WinningReason.Score:
        return {
          title: <>{winnerName} победил!</>,
          description: `по результатам подсчёта очков`,
        };
      default:
        return { title: "Игра завершена", description: "" };
    }
  };

  const { title, description } = getOutcomeDetails();

  return (
    <div className={styles.gameOverPanel}>
      <div className={styles.header}>
        <TrophyIcon className={styles.trophyIcon} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      {session.gameState.winningReason === WinningReason.Score && (
        <div className={styles.scoreDetails}>
          <div className={styles.playerScore}>
            <h4 className={styles.playerName}>{blackPlayer.name} (Чёрные)</h4>
            <div className={styles.totalScore}>{blackTotal.toFixed(1)}</div>
            <ul className={styles.breakdown}>
              <li>
                <span>Территория</span> <span>{territory.black}</span>
              </li>
              <li>
                <span>Пленные</span>{" "}
                <span>
                  {session.gameState.score.whiteCaptured +
                    session.gameState.score.whiteDeadStones.length}
                </span>
              </li>
            </ul>
          </div>

          <div className={styles.playerScore}>
            <h4 className={styles.playerName}>{whitePlayer.name} (Белые)</h4>
            <div className={styles.totalScore}>{whiteTotal.toFixed(1)}</div>
            <ul className={styles.breakdown}>
              <li>
                <span>Территория</span> <span>{territory.white}</span>
              </li>
              <li>
                <span>Пленные</span>{" "}
                <span>
                  {session.gameState.score.blackCaptured +
                    session.gameState.score.blackDeadStones.length}
                </span>
              </li>
              <li>
                <span>Коми</span> <span>{komi.toFixed(1)}</span>
              </li>
            </ul>
          </div>
          <div className={styles.finalMargin}>
            Победа с отрывом в <span>{scoreDifference.toFixed(1)}</span> очков
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={() => navigate(`/create-game/${GameSlug.Go}`)}>Новая игра</Button>

        <Button onClick={() => navigate("/games")} variant="secondary">
          Выйти
        </Button>
      </div>
    </div>
  );
};
