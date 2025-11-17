import ParametersInput from "@/components/ParametersInput";
import styles from "./LoadoutParams.module.scss";

export default function LoadoutParams({
  params,
  onChange,
  withStamina,
  typeMultipliers,
}) {
  return (
    <div className={styles.params}>
      <ParametersInput
        parameters={params}
        onChange={onChange}
        withStamina={withStamina}
        max={10000}
      />
      <div className={styles.typeMultipliers}>
        {Object.keys(typeMultipliers).map((param) => (
          <div key={param}>{Math.round(typeMultipliers[param] * 100)}%</div>
        ))}
        {withStamina && <div />}
      </div>
    </div>
  );
}
