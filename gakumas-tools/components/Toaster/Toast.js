import { memo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleInfo,
  FaXmark,
} from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./Toaster.module.scss";

const ICONS = {
  success: FaCircleCheck,
  error: FaCircleExclamation,
  info: FaCircleInfo,
};

function Toast({ toast, onDismiss }) {
  const t = useTranslations("Toaster");
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[toast.tone];

  useEffect(() => {
    if (paused || leaving) return;
    const timer = setTimeout(() => setLeaving(true), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, leaving, toast.duration]);

  function handleAnimationEnd(e) {
    if (leaving && e.target === e.currentTarget) onDismiss(toast.id);
  }

  return (
    <div
      className={c(styles.toast, styles[toast.tone], leaving && styles.leaving)}
      role={toast.tone == "error" ? "alert" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onAnimationEnd={handleAnimationEnd}
    >
      <Icon className={styles.icon} aria-hidden="true" />
      <span className={styles.message}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            toast.action.onClick();
            setLeaving(true);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => setLeaving(true)}
        aria-label={t("dismiss")}
      >
        <FaXmark aria-hidden="true" />
      </button>
    </div>
  );
}

export default memo(Toast);
