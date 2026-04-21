import { memo, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaCheck,
  FaEllipsisVertical,
  FaPenToSquare,
  FaRegFloppyDisk,
  FaRegTrashCan,
  FaUpload,
  FaXmark,
} from "react-icons/fa6";
import IconButton from "@/components/IconButton";
import styles from "./SimulationRuns.module.scss";

function ActionsCell({
  editMode,
  onConfirm,
  onCancel,
  onLoad,
  onSave,
  onRename,
  onDelete,
  canRename,
  t,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [menuOpen]);

  if (editMode) {
    return (
      <div className={styles.actionsCell}>
        <span title={t("save")}>
          <IconButton icon={FaCheck} onClick={onConfirm} />
        </span>
        <span title={t("cancel")}>
          <IconButton icon={FaXmark} onClick={onCancel} />
        </span>
      </div>
    );
  }

  const actions = [];
  if (onLoad) {
    actions.push({
      key: "load",
      icon: FaUpload,
      label: t("load"),
      onClick: onLoad,
    });
  }
  if (onRename && canRename) {
    actions.push({
      key: "rename",
      icon: FaPenToSquare,
      label: t("edit"),
      onClick: onRename,
    });
  }
  if (onSave) {
    actions.push({
      key: "save",
      icon: FaRegFloppyDisk,
      label: t("save"),
      onClick: onSave,
    });
  }
  if (onDelete) {
    actions.push({
      key: "delete",
      icon: FaRegTrashCan,
      label: t("delete"),
      onClick: onDelete,
      tone: "danger",
    });
  }

  return (
    <div className={styles.actionsCell}>
      <div className={styles.actionsInline}>
        {actions.map((a) => (
          <span key={a.key} title={a.label}>
            <IconButton icon={a.icon} onClick={a.onClick} />
          </span>
        ))}
      </div>
      <div className={styles.actionsMenu} ref={ref}>
        <IconButton
          icon={FaEllipsisVertical}
          onClick={() => setMenuOpen((v) => !v)}
        />
        {menuOpen && (
          <div className={styles.menuPopover} role="menu">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  type="button"
                  className={`${styles.menuItem} ${
                    a.tone === "danger" ? styles.menuItemDanger : ""
                  }`}
                  onClick={() => {
                    a.onClick();
                    setMenuOpen(false);
                  }}
                >
                  <Icon />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ActionsCell);
