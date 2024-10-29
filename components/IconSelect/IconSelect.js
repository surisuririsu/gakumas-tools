import { memo, useMemo, useState } from "react";
import Image from "@/components/Image";
import c from "@/utils/classNames";
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
        <button
          className={c(styles.option, styles.current)}
          onClick={() => setExpanded(true)}
        >
          <Image
            src={selectedOption.iconSrc}
            alt={selectedOption.alt}
            width={24}
            height={24}
            draggable={false}
          />
        </button>
      )}
      {displayedOptions.map(({ id, iconSrc, alt }) => (
        <button
          key={id}
          className={c(
            styles.option,
            selected === id && styles.selected,
            expanded && styles.expanded
          )}
          onClick={() => {
            onChange(id);
            if (collapsable) setExpanded(!expanded);
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
