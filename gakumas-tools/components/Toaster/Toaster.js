import { memo } from "react";
import Toast from "./Toast";
import styles from "./Toaster.module.scss";

function Toaster({ toasts, onDismiss }) {
  return (
    <div className={styles.toaster} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default memo(Toaster);
