import useBeat from "@/components/ProduceRankResult/useBeat";
import c from "@/utils/classNames";
import styles from "./ParamBadges.module.scss";

function Badge({ value }) {
  const beat = useBeat(value);

  return (
    <div className={c(styles.badge, beat && styles[`beat${beat}`])}>
      +{value}
    </div>
  );
}

export default function ParamBadges({ params }) {
  return (
    <div className={styles.badges}>
      {params.map((p, i) => (
        <Badge key={i} value={p} />
      ))}
    </div>
  );
}
