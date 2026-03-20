import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { API } from "src/api";
import { useAtom } from "jotai";
import { userAtom } from "src/store/user.ts";
import { authAtom } from "src/store/auth.ts";
import gamepadIcon from "src/components/icons/gamepad.png";

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useAtom(userAtom);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [, setAuth] = useAtom(authAtom);
  const [, setUser] = useAtom(userAtom);

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
    setMenuOpen(false);

    API.auth.logout().then(() => {
      setAuth((prev) => ({ ...prev, isLoggedIn: false }));
      setUser(null);
      navigate("/login");
    });
  };

  return (
    <header className={styles.header}>
      <Link to="/games" className={styles.logo}>
        <img src={gamepadIcon} alt="" className={styles.logoIcon} />
        MiniGames
      </Link>

      {user && (
        <div className={styles.user} ref={menuRef}>
          <span className={styles.username}>{user.email}</span>
          <img
            src={user.avatarUrl}
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
      )}
    </header>
  );
};
