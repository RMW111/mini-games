import React, { useState } from "react";
import { isAxiosError } from "axios";
import styles from "src/pages/RegistrationPage/RegistrationPage.module.scss";
import { API } from "src/api";
import { useNavigate } from "react-router-dom";

const RegistrationPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    try {
      const image = await fetch("https://picsum.photos/300/300").then((response) => response);
      console.log("image:", image.url);

      await API.auth.register({ email, password, avatarUrl: image.url });
      setSuccess("Вы успешно зарегистрированы!");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      navigate("/games");
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Произошла ошибка при регистрации.");
      } else {
        setError("Произошла ошибка при регистрации.");
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Регистрация</h2>
        <div className={styles.inputGroup}>
          <input
            type="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            type="password"
            id="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Подтвердите пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <button type="submit" className={styles.submitButton}>
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;
