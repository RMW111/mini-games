import styles from "./Cursor.module.scss";
import CursorIcon from "src/assets/icons/cursor.svg?react";
import { type RefObject, useEffect, useRef } from "react";
import type { Position } from "src/pages/PlayPage/PlayPage.types.ts";

interface Props {
  color?: string;
  positionRef: RefObject<Position>;
}

export const Cursor = ({ positionRef, color = "#8b5cf6" }: Props) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const cursorNode = cursorRef.current;
    if (!cursorNode) return;

    const currentPosition = positionRef.current;
    const smoothing = 0.3;

    const animate = () => {
      currentPosition.x += (positionRef.current.x - currentPosition.x) * smoothing;
      currentPosition.y += (positionRef.current.y - currentPosition.y) * smoothing;
      cursorNode.style.transform = `translate(${currentPosition.x}px, ${currentPosition.y}px)`;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div ref={cursorRef} className={styles.userCursor}>
      <CursorIcon width={26} height={26} fill={color} />
    </div>
  );
};
