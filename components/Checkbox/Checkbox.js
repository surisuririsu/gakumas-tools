import styles from "./Checkbox.module.scss";

export default function Checkbox({ checked, label, onChange }) {
  return (
    <div className={styles.checkbox} onClick={() => onChange(!checked)}>
      <input type="checkbox" checked={checked} readOnly />
      <label>{label}</label>
    </div>
  );
}
