import { useState } from "react";
import styles from "./CopyableInput.module.scss";
import { Button } from "src/components/ui/Button/Button.tsx";
import { CheckIcon } from "src/components/icons/CheckIcon.tsx";
import { CopyIcon } from "src/components/icons/CopyIcon.tsx";
import cn from "classnames";

interface Props {
  value: string;
  className?: string;
}

export const CopyableInput = ({ value, className }: Props) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className={cn(styles.container, className)}>
      <input
        title={value}
        type="text"
        value={value}
        readOnly
        className={styles.input}
        onClick={(e) => e.currentTarget.select()}
      />

      <Button
        className={cn(styles.copyButton, { [styles.copied]: isCopied })}
        onClick={handleCopy}
        aria-label={isCopied ? "Ссылка скопирована" : "Копировать ссылку"}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
};
