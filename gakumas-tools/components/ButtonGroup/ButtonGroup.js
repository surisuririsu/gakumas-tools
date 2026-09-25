import { memo, useRef } from "react";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import useSelectedRect from "@/utils/useSelectedRect";
import styles from "./ButtonGroup.module.scss";

const SELECTED = `.${styles.selected}`;
const LEAD = "260ms cubic-bezier(0.22, 1, 0.36, 1)";
const TRAIL = "420ms cubic-bezier(0.32, 1.34, 0.52, 1)";

function thumbTransition(direction) {
  if (direction > 0) return `left ${TRAIL}, right ${LEAD}`;
  if (direction < 0) return `left ${LEAD}, right ${TRAIL}`;
  return undefined;
}

// Options with an href render as links (crawlable navigation); options
// without one render as buttons and report selection through onChange.
function ButtonGroup({ className, selected, options, onChange }) {
  const ref = useRef(null);
  const thumb = useSelectedRect(ref, SELECTED, selected);

  return (
    <div
      ref={ref}
      className={c(styles.buttonGroup, thumb && styles.measured, className)}
    >
      {thumb && (
        <span
          className={styles.thumb}
          style={{
            left: thumb.left,
            right: thumb.right,
            top: thumb.top,
            height: thumb.height,
            transition: thumbTransition(thumb.direction),
          }}
          aria-hidden="true"
        />
      )}
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
