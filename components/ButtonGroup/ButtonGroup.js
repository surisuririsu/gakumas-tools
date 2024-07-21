import styles from "./ButtonGroup.module.scss";

export default function ButtonGroup({ selected, options, onChange }) {
  return (
    <div className={styles.buttonGroup}>
      {options.map((option) => (
        <button
          key={option}
          className={option == selected ? styles.selected : null}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
