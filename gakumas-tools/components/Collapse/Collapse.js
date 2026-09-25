import { memo, useState } from "react";
import c from "@/utils/classNames";
import styles from "./Collapse.module.scss";

function Collapse({ open, className, children }) {
  const [phase, setPhase] = useState(open ? "open" : "closed");
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    setPhase(open ? "opening" : "closing");
  }

  if (phase == "closed") return null;

  return (
    <div
      className={c(styles.collapse, styles[phase])}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setPhase(open ? "open" : "closed");
      }}
    >
      <div className={c(styles.inner, className)}>{children}</div>
    </div>
  );
}

export default memo(Collapse);
