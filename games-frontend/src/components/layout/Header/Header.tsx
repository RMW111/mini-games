import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.scss";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "src/types/user.ts";
import { API } from "src/api";

interface HeaderProps {
  user?: User;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onLogout = () => {
    API.auth.logout().then(() => navigate("/login"));
  };

  return (
    <header className={styles.header}>
      <Link to="/games" className={styles.logo}>
        🎮 MiniGames
      </Link>

      <div className={styles.user} ref={menuRef}>
        <span className={styles.username}>{user?.email}</span>
        <img
          src="https://picsum.photos/300/300"
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
