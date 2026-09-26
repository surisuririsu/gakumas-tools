import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import c from "@/utils/classNames";
import styles from "./DifficultyPicker.module.scss";

export default function DifficultyPicker({ difficulties, selected, onChange }) {
  const t = useTranslations("Calculator");

  const options = difficulties.map((d) => ({
    value: d,
    label: <span className={styles[d]}>{t(`difficulties.${d}`)}</span>,
  }));

  return (
    <ButtonGroup
      className={c(styles.difficultyPicker, styles[`${selected}Selected`])}
      options={options}
      selected={selected}
      onChange={onChange}
    />
  );
}
