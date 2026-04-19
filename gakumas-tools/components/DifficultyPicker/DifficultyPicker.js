import { useTranslations } from "next-intl";
import c from "@/utils/classNames";
import styles from "./DifficultyPicker.module.scss";

export default function DifficultyPicker({ difficulties, selected, onChange }) {
  const t = useTranslations("Calculator");

  return (
    <div className={styles.difficultyPicker}>
      {difficulties.map((d) => (
        <button
          key={d}
          type="button"
          className={c(
            styles.difficultyChip,
            styles[d],
            selected === d && styles.selected
          )}
          onClick={() => onChange(d)}
        >
          {t(`difficulties.${d}`)}
        </button>
      ))}
    </div>
  );
}
