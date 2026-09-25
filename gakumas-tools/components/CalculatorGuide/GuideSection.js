"use client";
import { useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import c from "@/utils/classNames";
import styles from "./CalculatorGuide.module.scss";

export default function GuideSection({ title, children }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);

  const toggle = () => {
    setOpen(!open);
    setMoving(true);
  };

  return (
    <section className={c(styles.section, open && styles.open)}>
      <h2 className={styles.sectionTitle}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
        >
          {title}
          <FaChevronDown className={styles.caret} aria-hidden="true" />
        </button>
      </h2>
      <div
        id={id}
        className={c(
          styles.body,
          moving && (open ? styles.opening : styles.closing)
        )}
        hidden={!open && !moving}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setMoving(false);
        }}
      >
        <div className={styles.inner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </section>
  );
}
