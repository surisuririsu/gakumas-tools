import EntityIcon from "@/components/EntityIcon";
import { EntityTypes } from "@/utils/entities";
import styles from "./StagePItems.module.scss";

export default function StagePItems({ pItemIds, widget, size }) {
  return (
    <div className={styles.stagePItems}>
      {pItemIds.map((pItemId, index) => (
        <EntityIcon
          key={`${index}_${pItemId}`}
          type={EntityTypes.P_ITEM}
          id={pItemId}
          widget={widget}
          index={index}
          size={size}
        />
      ))}
    </div>
  );
}
