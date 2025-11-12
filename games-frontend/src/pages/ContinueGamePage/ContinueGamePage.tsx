import { type ElementType, useEffect, useState } from "react";
import { API } from "src/api";
import { useParams } from "react-router-dom";
import styles from "./ContinueGamePage.module.scss";
import { type Session, SessionStatus } from "src/types/session.ts";
import { Loader } from "src/components/ui/Loader/Loader.tsx";
import { Button } from "src/components/ui/Button/Button";
import { Container } from "src/components/layout/Container/Container.tsx";
import { SessionCard } from "src/pages/ContinueGamePage/SessionCard/SessionCard.tsx";
import { useAtom } from "jotai/index";
import { userAtom } from "src/store/user.ts";
import { GameSlug } from "src/types/game.ts";
import { MinesweeperSessionInfo } from "src/pages/ContinueGamePage/MinesweeperSessionInfo/MinesweeperSessionInfo.tsx";
import { GoSessionInfo } from "src/pages/ContinueGamePage/GoSessionInfo/GoSessionInfo.tsx";

const SESSIONS_PER_PAGE = 10;

const sessionCardInfo: Record<string, ElementType> = {
  [GameSlug.Minesweeper]: MinesweeperSessionInfo,
  [GameSlug.Go]: GoSessionInfo,
};

export const ContinueGamePage = () => {
  const [user] = useAtom(userAtom);
  const { slug } = useParams<{ slug: string }>();
  const [sessions, setSessions] = useState<Session[]>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSessions(page);
  }, []);

  const loadSessions = (page: number) => {
    setIsLoading(true);

    const params = {
      page,
      size: SESSIONS_PER_PAGE,
      excludedStatuses: SessionStatus.Completed,
      userId: user?.id,
    };
    API.games
      .getGameSessions(slug!)({ params })
      .then((newSessions) => {
        setSessions([...(sessions || []), ...newSessions]);
        if (newSessions.length < SESSIONS_PER_PAGE) {
          setHasMore(false);
        }
      })
      .finally(() => setIsLoading(false));
  };

  const loadMore = () => {
    setPage(page + 1);
    loadSessions(page + 1);
  };

  if (!sessions) {
    return <Loader />;
  }

  const renderContent = () => {
    if (!isLoading && sessions.length === 0) {
      return <p className={styles.noSessions}>Активных сессий не найдено.</p>;
    }

    return (
      <div className={styles.sessionList}>
        {sessions.map((session) => {
          const CardInfo = sessionCardInfo[slug!];
          return (
            <SessionCard key={session.id} session={session}>
              <CardInfo gameState={session.gameState} />
            </SessionCard>
          );
        })}
      </div>
    );
  };

  return (
    <Container>
      <div className={styles.pageContainer}>
        <h1 className={styles.title}>Продолжить игру</h1>
        {renderContent()}
        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <Button onClick={loadMore} isLoading={isLoading}>
              Загрузить ещё
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
};
