import { memo } from "react";
import {
  FaCircleCheck,
  FaCircleExclamation,
  FaCircleInfo,
  FaTriangleExclamation,
} from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./Alert.module.scss";

const ICONS = {
  neutral: FaCircleInfo,
  info: FaCircleInfo,
  success: FaCircleCheck,
  warning: FaTriangleExclamation,
  danger: FaCircleExclamation,
};

function Alert({ children, variant = "neutral", className }) {
  const Icon = ICONS[variant] || FaCircleInfo;
  return (
    <div className={c(styles.alert, styles[variant], className)}>
      <Icon className={styles.icon} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default memo(Alert);
