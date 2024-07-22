import PItem from "@/components/PItem";
import styles from "./StagePItems.module.scss";

export default function StagePItems({ pItemIds }) {
  return (
    <div className={styles.stagePItems}>
      {pItemIds.map((pItemId, index) => (
        <PItem
          key={`${index}_${pItemId}`}
          pItemId={pItemId}
          index={index}
          small
        />
      ))}
    </div>
  );
}
