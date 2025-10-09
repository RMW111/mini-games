import "./App.css";
import RegistrationPage from "src/pages/RegistrationPage/RegistrationPage.tsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Header } from "src/components/layout/Header/Header.tsx";
import { LoginPage } from "src/pages/LoginPage/LoginPage.tsx";
import { GamesPage } from "src/pages/GamesPage/GamesPage.tsx";
import { Interceptor } from "src/components/layout/Interceptor/Interceptor.tsx";
import { API } from "src/api";
import { GameLobbyPage } from "src/pages/GameLobbyPage/GameLobbyPage.tsx";
import { PlayPage } from "src/pages/PlayPage/PlayPage.tsx";
import { useEffect } from "react";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    API.getUserInfo().then(console.log);
  }, []);

  const onLogout = () => {
    API.auth.logout().then(() => navigate("/login"));
  };

  return (
    <Interceptor>
      <Header
        username={"LOLsho"}
        avatarUrl={
          "https://img.freepik.com/free-photo/closeup-scarlet-macaw-from-side-view-scarlet-macaw-closeup-head_488145-3540.jpg?semt=ais_hybrid&w=740&q=80"
        }
        onLogout={onLogout}
      />

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
