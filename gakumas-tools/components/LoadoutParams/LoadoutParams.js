import ParametersInput from "@/components/ParametersInput";
import styles from "./LoadoutParams.module.scss";

export default function LoadoutParams({
  params,
  onChange,
  withStamina,
  staminaAction,
  typeMultipliers,
}) {
  const footers = Object.keys(typeMultipliers).map(
    (param) => `${Math.round(typeMultipliers[param] * 100)}%`,
  );
  if (withStamina) footers.push(staminaAction);

  return (
    <div className={styles.params}>
      <ParametersInput
        parameters={params}
        onChange={onChange}
        withStamina={withStamina}
        max={10000}
        attached
        footers={footers}
      />
    </div>
  );
}
