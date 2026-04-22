import { memo } from "react";
import { FaEllipsisVertical, FaXmark } from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import ActionIconList from "./ActionIconList";
import styles from "./SimulationRuns.module.scss";

function ActionsCell({ items, menuOpen, onToggle, editMode }) {
  return (
    <div className={styles.actionsCell}>
      <div
        className={`${styles.actionsInline} ${
          editMode ? styles.actionsInlineForce : ""
        }`}
      >
        <ActionIconList items={items} />
      </div>
      {!editMode && items.length > 0 && (
        <div className={styles.actionsTrigger}>
          <IconButton
            icon={menuOpen ? FaXmark : FaEllipsisVertical}
            onClick={onToggle}
          />
        </div>
      )}
    </div>
  );
}

export default memo(ActionsCell);
