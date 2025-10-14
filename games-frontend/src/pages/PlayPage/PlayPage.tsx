import { cursorColors, gamesComponents } from "src/pages/PlayPage/PlayPage.constants.tsx";
import { useParams } from "react-router-dom";
import { type MouseEvent, type RefObject, Suspense, useEffect, useRef, useState } from "react";
import { type ServerMsg, ServerMsgType } from "src/types/serverMsg.ts";
import type { Session } from "src/types/session.ts";
import { type SessionMsg, SessionMsgType } from "src/types/sessionMsg.ts";
import { Loader } from "src/components/ui/Loader/Loader.tsx";
import styles from "./PlayPage.module.scss";
import { Cursor } from "src/components/ui/Cursor/Cursor.tsx";
import { useThrottledCallback } from "use-debounce";
import type { Position } from "src/pages/PlayPage/PlayPage.types.ts";
import { useSessionWS } from "src/hooks/useSessionWS.ts";
import { GameSlug } from "src/types/game.ts";
import { createCursorWsMsg } from "src/pages/PlayPage/PlayPage.utils.ts";
import { ClientCursorMsgType } from "src/types/clientCursorMsg.ts";
import { type ServerCursorMsg, ServerCursorMsgType } from "src/types/serverCursorMsg.ts";
import { Container } from "src/components/layout/Container/Container.tsx";

export const PlayPage = () => {
  const { slug = GameSlug.Minesweeper, sessionId = "" } = useParams<{
    slug: GameSlug;
    sessionId: string;
  }>();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const GameComponent = gamesComponents[slug] || null;
  const socket = useRef<WebSocket | null>(null);
  const { sendCursorMsg } = useSessionWS(socket.current, slug);
  const [session, setSession] = useState<Session>();
  const [userCursorsPositions, setUserCursorsPositions] = useState<
    Record<string, RefObject<Position>>
  >({});

  const updateMousePositionThrottled = useThrottledCallback((position: Position) => {
    if (session!.participants.length > 1) {
      const cursorMsg = createCursorWsMsg(ClientCursorMsgType.Move, position);
      sendCursorMsg(cursorMsg);
    }
  }, 33);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const baseUrl = import.meta.env.DEV
      ? "ws://localhost:8080"
      : `${protocol}://${window.location.host}`;
    const newSocket = new WebSocket(`${baseUrl}/ws/sessions/${sessionId}`);

    newSocket.onmessage = (event) => {
      try {
        const parsedMessage: ServerMsg = JSON.parse(event.data);
        console.log("parsedMessage:", parsedMessage);
        handleSocketMessage(parsedMessage);
      } catch (error) {
        console.error("Failed to parse server message:", error);
      }
    };

    newSocket.onclose = (event) => {
      console.log("WebSocket Connection Closed:", event.code, event.reason);
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.current = newSocket;

    return () => newSocket.close();
  }, [sessionId]);

  const handleSocketMessage = (event: ServerMsg) => {
    switch (event.type) {
      case ServerMsgType.Session:
        return handleSessionMsg(event.payload);
      case ServerMsgType.Cursor:
        return handleCursorMsg(event.payload);
    }
  };

  const handleCursorMsg = (event: ServerCursorMsg) => {
    switch (event.type) {
      case ServerCursorMsgType.Move:
        console.log("update position:", event.payload);
        return setUserCursorsPositions((positions) => {
          const { userId } = event.payload;
          if (positions[userId]) {
            positions[userId].current = event.payload.pos;
            return { ...positions, [userId]: positions[userId] };
          }
          const ref = { current: event.payload.pos } as RefObject<Position>;
          return { ...positions, [userId]: ref };
        });
    }
  };

  const handleSessionMsg = (event: SessionMsg) => {
    switch (event.type) {
      case SessionMsgType.FullSessionState:
        return setSession(event.payload);
      case SessionMsgType.GameStateUpdate:
        return setSession((session) => ({ ...session!, gameState: event.payload }));
      case SessionMsgType.StatusUpdate:
        return setSession((session) => ({ ...session!, status: event.payload }));
      case SessionMsgType.UserJoined:
        return setSession((session) => ({
          ...session!,
          participants: [...session!.participants, event.payload.participant],
        }));
    }
  };

  const onMouseMove = ({ clientX, clientY }: MouseEvent) => {
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    updateMousePositionThrottled({ x, y });
  };

  if (!session) {
    return <Loader text="Подключение к игровой сессии..." />;
  }

  if (!GameComponent) {
    return (
      <div className={styles.statusContainer}>Ошибка: Игра с названием "{slug}" не найдена.</div>
    );
  }

  const cursors = Object.entries(userCursorsPositions).map(([userId, position], index) => {
    return <Cursor key={userId} positionRef={position} color={cursorColors[index]} />;
  });

  console.log("userCursorsPositions:", userCursorsPositions);

  return (
    <Container className={styles.container}>
      {cursors}

      <main className={styles.gameArea} onMouseMove={onMouseMove} ref={gameAreaRef}>
        <Suspense fallback={<Loader text="Загрузка компонентов игры..." />}>
          <GameComponent sessionId={sessionId} session={session} socket={socket} />
        </Suspense>
      </main>
    </Container>
  );
};
