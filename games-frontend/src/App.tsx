import "./App.css";
import RegistrationPage from "src/pages/RegistrationPage/RegistrationPage.tsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "src/components/layout/Header/Header.tsx";
import { LoginPage } from "src/pages/LoginPage/LoginPage.tsx";
import { GamesPage } from "src/pages/GamesPage/GamesPage.tsx";
import { Interceptor } from "src/components/layout/Interceptor/Interceptor.tsx";
import { API } from "src/api";
import { GameLobbyPage } from "src/pages/GameLobbyPage/GameLobbyPage.tsx";
import { PlayPage } from "src/pages/PlayPage/PlayPage.tsx";
import { useEffect, useState } from "react";
import type { User } from "src/types/user.ts";

function App() {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    // API.getUserInfo().then(setUser);
  }, []);

  return (
    <Interceptor>
      <Header user={user} />

      <Routes>
        <Route path="/" element={<Navigate to="/games" replace />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:slug" element={<GameLobbyPage />} />
        <Route path="/play/:slug/:sessionId" element={<PlayPage />} />
      </Routes>
    </Interceptor>
  );
}

export default App;
