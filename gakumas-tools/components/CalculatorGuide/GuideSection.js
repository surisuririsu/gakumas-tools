"use client";
import { useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import Collapse from "@/components/Collapse";
import c from "@/utils/classNames";
import styles from "./CalculatorGuide.module.scss";

export default function GuideSection({ title, children }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <section className={c(styles.section, open && styles.open)}>
      <h2 className={styles.sectionTitle}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {title}
          <FaChevronDown className={styles.caret} aria-hidden="true" />
        </button>
      </h2>
      <Collapse open={open} keepMounted id={id}>
        <div className={styles.content}>{children}</div>
      </Collapse>
    </section>
  );
}
