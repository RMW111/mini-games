import type { PropsWithChildren, MouseEvent } from "react";
import styles from "./Popup.module.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const Popup = ({ isOpen, onClose, title, children }: PropsWithChildren<ModalProps>) => {
  if (!isOpen) {
    return null;
  }

  const onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};
