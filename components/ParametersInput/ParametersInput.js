import styles from "./ParametersInput.module.scss";

const PARAMETER_NAMES = ["Vocal", "Dance", "Visual"];
const MIN = 0;
const MAX = 1500;

export default function ParametersInput({ parameters, onChange }) {
  return (
    <div className={styles.parameters}>
      {PARAMETER_NAMES.map((name, i) => (
        <input
          key={name}
          type="number"
          placeholder={name}
          onChange={(e) =>
            onChange([
              ...parameters.slice(0, i),
              Math.min(Math.max(parseInt(e.target.value, 10), MIN), MAX),
              ...parameters.slice(i + 1),
            ])
          }
          value={parameters[i] ?? ""}
        ></input>
      ))}
    </div>
  );
}
