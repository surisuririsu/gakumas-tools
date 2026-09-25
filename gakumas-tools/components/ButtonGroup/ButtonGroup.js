import { memo } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./ButtonGroup.module.scss";

// Options with an href render as links (crawlable navigation); options
// without one render as buttons and report selection through onChange.
function ButtonGroup({ className, selected, options, onChange }) {
  return (
    <div className={c(styles.buttonGroup, className)}>
      {options.map(({ value, label, href }) =>
        href ? (
          <Link
            key={value}
            href={href}
            className={value == selected ? styles.selected : null}
            aria-current={value == selected ? "page" : undefined}
          >
            {label}
          </Link>
        ) : (
          <button
            key={value}
            className={value == selected ? styles.selected : null}
            aria-pressed={value == selected}
            onClick={() => onChange(value)}
          >
            {label}
          </button>
        )
      )}
    </div>
  );
}

export default memo(ButtonGroup);
