import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.scss";
import { API } from "src/api";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Заполните все поля");
      return;
    }

    API.auth.login({ email, password }, { withCredentials: true }).then(() => navigate("/games"));
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Вход</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Войти
        </button>
      </form>
    </div>
  );
};
