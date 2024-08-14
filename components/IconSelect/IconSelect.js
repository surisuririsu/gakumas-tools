import { memo } from "react";
import Image from "next/image";
import styles from "./IconSelect.module.scss";

function IconSelect({ options, selected, onChange }) {
  return (
    <div className={styles.iconSelect}>
      {options.map(({ id, iconSrc, alt }) => (
        <button
          key={id}
          className={`${styles.option} ${
            selected === id ? styles.selected : ""
          }`}
        >
          <Image
            src={iconSrc}
            alt={alt}
            onClick={() => onChange(id)}
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
