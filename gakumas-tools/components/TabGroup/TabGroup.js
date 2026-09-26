import { memo, useRef } from "react";
import c from "@/utils/classNames";
import useSelectedRect from "@/utils/useSelectedRect";
import styles from "./TabGroup.module.scss";

const ARROW_OFFSETS = { ArrowLeft: -1, ArrowRight: 1 };
const SELECTED = `.${styles.selected}`;
const INK_WIDTH = 32;

function TabGroup({ className, selected, options, onChange }) {
  const ref = useRef(null);
  const tab = useSelectedRect(ref, SELECTED, selected);

  function handleKeyDown(e) {
    const offset = ARROW_OFFSETS[e.key];
    if (!offset) return;
    e.preventDefault();
    const index = options.findIndex(({ value }) => value == selected);
    const next = (index + offset + options.length) % options.length;
    onChange(options[next].value);
    e.currentTarget.children[next]?.focus();
  }

  return (
    <div
      ref={ref}
      className={c(styles.tabGroup, tab && styles.measured, className)}
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {options.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={value == selected}
          tabIndex={value == selected ? 0 : -1}
          className={value == selected ? styles.selected : null}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
      {tab && (
        <span
          className={styles.ink}
          style={{
            translate: `${tab.left + (tab.width - INK_WIDTH) / 2}px 0`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default memo(TabGroup);
