import { memo, useState } from "react";
import Image from "next/image";
import styles from "./IconSelect.module.scss";

function IconSelect({ options, selected, onChange, collapsable }) {
  const [expanded, setExpanded] = useState(!collapsable);
  const selectedOption = options.find((opt) => opt.id == selected);

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
        options.map(({ id, iconSrc, alt }) => (
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
