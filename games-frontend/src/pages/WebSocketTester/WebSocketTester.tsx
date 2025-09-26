import { useEffect, useRef, useState } from "react";

// Определим типы сообщений для строгости
interface ServerMessage {
  type: string;
  [key: string]: any; // Позволяет иметь любые другие поля
}

interface WebSocketTesterProps {
  sessionId: string;
}

export const WebSocketTester = ({ sessionId }: WebSocketTesterProps) => {
  const [status, setStatus] = useState("Disconnected");
  const [receivedMessages, setReceivedMessages] = useState<ServerMessage[]>([]);

  // Используем useRef для хранения сокета, чтобы его изменение не вызывало ре-рендер
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // --- Установка соединения ---
    // URL должен начинаться с ws:// (не http://) и указывать на ваш бэкенд
    const wsUrl = `ws://localhost:4000/ws/sessions/${sessionId}`;
    console.log(`Connecting to ${wsUrl}...`);
    setStatus("Connecting");

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = (e) => {
      console.log("WebSocket Connection Opened!", e);
      setStatus("Connected");
    };

    newSocket.onmessage = (event) => {
      console.log("Received message:", event.data);
      try {
        const parsedMessage: ServerMessage = JSON.parse(event.data);
        // Добавляем новое сообщение в начало списка
        setReceivedMessages((prev) => [parsedMessage, ...prev]);
      } catch (error) {
        console.error("Failed to parse server message:", error);
      }
    };

    newSocket.onclose = (event) => {
      console.log("WebSocket Connection Closed:", event.code, event.reason);
      setStatus("Disconnected");
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("Error");
    };

    socket.current = newSocket;

    // --- Очистка при размонтировании компонента ---
    // Это КРИТИЧЕСКИ ВАЖНО, чтобы избежать утечек памяти и "зомби"-соединений.
    return () => {
      console.log("Closing WebSocket connection...");
      newSocket.close();
    };
  }, [sessionId]); // Переподключаемся, если sessionId изменился

  const handleSendMessage = () => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      // Сообщение должно соответствовать вашему `ClientMessage` enum на бэкенде
      // Например, симулируем клик по ячейке
      const testMessage = {
        type: "clickCell",
        row: 1,
        col: 2,
      };

      console.log("Sending message:", testMessage);
      socket.current.send(JSON.stringify(testMessage));
    } else {
      console.error("Cannot send message, WebSocket is not open.");
    }
  };

  return (
    <div
      style={{
        border: "2px solid #646cff",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
      <h2>WebSocket Tester</h2>
      <p>
        Session ID: <strong>{sessionId}</strong>
      </p>
      <p>
        Connection Status: <strong>{status}</strong>
      </p>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleSendMessage}>Send Test 'clickCell' Message</button>
      </div>

      <h3>Received Messages:</h3>
      <div
        style={{
          backgroundColor: "#242424",
          padding: "10px",
          height: "300px",
          overflowY: "auto",
          borderRadius: "4px",
        }}
      >
        {receivedMessages.length === 0 ? (
          <p>No messages received yet.</p>
        ) : (
          receivedMessages.map((msg, index) => (
            <pre key={index} style={{ borderBottom: "1px solid #444", paddingBottom: "5px" }}>
              {JSON.stringify(msg, null, 2)}
            </pre>
          ))
        )}
      </div>
    </div>
  );
};
