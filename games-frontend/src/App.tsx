import "./App.css";
import RegistrationPage from "src/pages/RegistrationPage/RegistrationPage.tsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "src/components/layout/Header/Header.tsx";
import { LoginPage } from "src/pages/LoginPage/LoginPage.tsx";
import { GamesPage } from "src/pages/GamesPage/GamesPage.tsx";
import { API } from "src/api";
import { GameLobbyPage } from "src/pages/GameLobbyPage/GameLobbyPage.tsx";
import { PlayPage } from "src/pages/PlayPage/PlayPage.tsx";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { userAtom } from "src/store/user.ts";
import { authAtom } from "src/store/auth.ts";
import { ProtectedRoute } from "src/components/layout/ProtectedRoute/ProtectedRoute.tsx";

function App() {
  const [, setUser] = useAtom(userAtom);
  const [, setAuth] = useAtom(authAtom);

  useEffect(() => {
    API.getUserInfo()
      .then((user) => {
        setUser(user);
        setAuth({ isLoggedIn: true, pending: false });
      })
      .catch(() => setAuth({ isLoggedIn: false, pending: false }));
  }, []);

  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to="/games" replace />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/games/:slug"
          element={
            <ProtectedRoute>
              <GameLobbyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/play/:slug/:sessionId"
          element={
            <ProtectedRoute>
              <PlayPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
