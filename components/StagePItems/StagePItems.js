import EntityIcon from "@/components/EntityIcon";
import { EntityTypes } from "@/utils/entities";
import styles from "./StagePItems.module.scss";

export default function StagePItems({ pItemIds }) {
  return (
    <div className={styles.stagePItems}>
      {pItemIds.map((pItemId, index) => (
        <EntityIcon
          key={`${index}_${pItemId}`}
          type={EntityTypes.P_ITEM}
          id={pItemId}
          widget="memory_editor"
          index={index}
          small
        />
      ))}
    </div>
  );
}
