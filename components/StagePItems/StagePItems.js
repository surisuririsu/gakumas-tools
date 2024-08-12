import { useContext } from "react";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./StagePItems.module.scss";

export default function StagePItems({ pItemIds, replacePItemId, size }) {
  const { pickPItemModal } = useContext(ModalContext);
  return (
    <div className={styles.stagePItems}>
      {pItemIds.map((pItemId, index) => (
        <EntityIcon
          key={`${index}_${pItemId}`}
          type={EntityTypes.P_ITEM}
          id={pItemId}
          onClick={() =>
            pickPItemModal((entity) => replacePItemId(index, entity.id), {
              sourceTypes: ["support"],
            })
          }
          size={size}
        />
      ))}
    </div>
  );
}
