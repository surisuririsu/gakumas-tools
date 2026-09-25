import useBeat from "@/components/ProduceRankResult/useBeat";
import c from "@/utils/classNames";
import styles from "./Params.module.scss";

function Param({ value }) {
  const beat = useBeat(value);

  return (
    <div className={c(styles.param, beat && styles[`beat${beat}`])}>
      {value}
    </div>
  );
}

export default function Params({ params }) {
  return (
    <div className={styles.params}>
      {params.map((p, i) => (
        <Param key={i} value={p} />
      ))}
    </div>
  );
}
