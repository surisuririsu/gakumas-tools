import { usePopOnChange } from "@/utils/usePop";
import c from "@/utils/classNames";
import styles from "./ProduceRankCalculator.module.scss";

export default function InfoTag({ label, value, className }) {
  const beat = usePopOnChange(value ?? label);

  return (
    <span
      className={c(styles.tag, beat && styles[`beat${beat}`], className)}
    >
      {label}
      {value != null && <b>{value}</b>}
    </span>
  );
}
