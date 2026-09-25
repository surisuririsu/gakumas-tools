import { memo } from "react";
import c from "@/utils/classNames";
import styles from "./TabGroup.module.scss";

const ARROW_OFFSETS = { ArrowLeft: -1, ArrowRight: 1 };

function TabGroup({ className, selected, options, onChange }) {
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
      className={c(styles.tabGroup, className)}
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
    </div>
  );
}

export default memo(TabGroup);
