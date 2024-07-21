import Image from "next/image";
import styles from "./IconSelect.module.scss";

export default function IconSelect({ options, selected, onChange }) {
  return (
    <div className={styles.iconSelect}>
      {options.map(({ id, iconSrc }) => (
        <div
          key={id}
          className={`${styles.option} ${
            selected === id ? styles.selected : ""
          }`}
        >
          <div className={styles.imageWrapper}>
            <Image
              src={iconSrc}
              fill
              alt=""
              onClick={() => onChange(id)}
              sizes="24px"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
