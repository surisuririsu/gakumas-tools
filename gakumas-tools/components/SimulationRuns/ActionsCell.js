import { memo } from "react";
import { useTranslations } from "next-intl";
import { FaEllipsisVertical, FaXmark } from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import ActionIconList from "./ActionIconList";
import styles from "./SimulationRuns.module.scss";

function ActionsCell({ items, menuOpen, onToggle, editMode }) {
  const t = useTranslations("CompareTab");
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
            ariaLabel={t("actions")}
          />
        </div>
      )}
    </div>
  );
}

export default memo(ActionsCell);
