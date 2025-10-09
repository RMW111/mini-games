import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.scss";
import { Link } from "react-router-dom";

interface HeaderProps {
  username: string;
  avatarUrl: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ username, avatarUrl, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <Link to="/games" className={styles.logo}>
        🎮 MiniGames
      </Link>

      <div className={styles.user} ref={menuRef}>
        <span className={styles.username}>{username}</span>
        <img
          src={avatarUrl}
          alt="avatar"
          className={styles.avatar}
          onClick={() => setMenuOpen(!menuOpen)}
        />
        {menuOpen && (
          <div className={styles.dropdown}>
            <button onClick={() => {}}>Профиль</button>
            <button onClick={onLogout}>Выйти</button>
          </div>
        )}
      </div>
    </header>
  );
};
