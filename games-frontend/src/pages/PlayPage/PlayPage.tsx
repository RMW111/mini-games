import { gamesComponents } from "src/pages/PlayPage/PlayPage.constants.tsx";
import { useParams } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import { type SocketEvent, SocketEventType } from "src/types/socketEvent.ts";
import type { Session } from "src/types/session.ts";
import { type SessionEvent, SessionEventType } from "src/types/sessionEvent.ts";
import { Loader } from "src/components/ui/Loader/Loader.tsx";
import styles from "./PlayPage.module.scss";

export const PlayPage = () => {
  const { slug = "", sessionId = "" } = useParams<{ slug: string; sessionId: string }>();
  const GameComponent = gamesComponents[slug] || null;
  const socket = useRef<WebSocket | null>(null);
  const [session, setSession] = useState<Session>();
  console.log("session:", session);

  useEffect(() => {
    const newSocket = new WebSocket(`wss://${window.location.host}/ws/sessions/${sessionId}`);

    newSocket.onmessage = (event) => {
      try {
        const parsedMessage: SocketEvent = JSON.parse(event.data);
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

  const handleSocketMessage = (event: SocketEvent) => {
    switch (event.type) {
      case SocketEventType.Session:
        handleSessionMessage(event.payload);
    }
  };

  const handleSessionMessage = (event: SessionEvent) => {
    switch (event.type) {
      case SessionEventType.FullSessionState:
        return setSession(event.payload);
      case SessionEventType.GameStateUpdate:
        return setSession((session) => ({ ...session!, gameState: event.payload }));
      case SessionEventType.StatusUpdate:
        return setSession((session) => ({ ...session!, status: event.payload }));
    }
  };

  if (!session) {
    return <Loader text="Подключение к игровой сессии..." />;
  }

  if (!GameComponent) {
    return (
      <div className={styles.statusContainer}>Ошибка: Игра с названием "{slug}" не найдена.</div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.gameArea}>
        <Suspense fallback={<Loader text="Загрузка компонентов игры..." />}>
          <GameComponent sessionId={sessionId} session={session} socket={socket} />
        </Suspense>
      </main>
    </div>
  );
};
