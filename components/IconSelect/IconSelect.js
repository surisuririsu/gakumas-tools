import { memo, useMemo, useState } from "react";
import Image from "next/image";
import styles from "./IconSelect.module.scss";

const ALL_OPTION = {
  id: null,
  iconSrc: "/all.png",
  alt: "All",
};

function IconSelect({ options, selected, onChange, collapsable, includeAll }) {
  const [expanded, setExpanded] = useState(!collapsable);
  const selectedOption =
    includeAll && !selected
      ? ALL_OPTION
      : options.find((opt) => opt.id == selected);
  const displayedOptions = useMemo(
    () => (includeAll ? [ALL_OPTION, ...options] : options),
    [includeAll, options]
  );

  return (
    <div className={styles.iconSelect}>
      {!expanded && (
        <button className={styles.option} onClick={() => setExpanded(true)}>
          <Image
            src={selectedOption.iconSrc}
            alt={selectedOption.alt}
            width={24}
            height={24}
            draggable={false}
          />
        </button>
      )}
      {expanded &&
        displayedOptions.map(({ id, iconSrc, alt }) => (
          <button
            key={id}
            className={`${styles.option} ${
              selected === id ? styles.selected : ""
            }`}
            onClick={() => {
              onChange(id);
              if (collapsable) setExpanded(false);
            }}
          >
            <Image
              src={iconSrc}
              alt={alt}
              width={24}
              height={24}
              draggable={false}
            />
          </button>
        ))}
    </div>
  );
}

export default memo(IconSelect);
