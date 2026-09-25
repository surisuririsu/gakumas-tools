import { memo, useState } from "react";
import c from "@/utils/classNames";
import styles from "./Collapse.module.scss";

function Collapse({ open, keepMounted, id, className, children }) {
  const [phase, setPhase] = useState(open ? "open" : "closed");
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    setPhase(open ? "opening" : "closing");
  }

  if (phase == "closed" && !keepMounted) return null;

  return (
    <div
      id={id}
      className={c(styles.collapse, styles[phase])}
      hidden={phase == "closed"}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setPhase(open ? "open" : "closed");
      }}
    >
      <div className={styles.inner}>
        {className ? <div className={className}>{children}</div> : children}
      </div>
    </div>
  );
}

export default memo(Collapse);
