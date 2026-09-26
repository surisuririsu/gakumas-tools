import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import c from "@/utils/classNames";
import { CALCULATOR_PATH_BY_SCENARIO, SCENARIOS } from "@/utils/scenarios";
import styles from "./ScenarioPicker.module.scss";

export default function ScenarioPicker({ selected, onChange }) {
  const t = useTranslations("Calculator");

  const options = SCENARIOS.map((s) => ({
    value: s,
    label: <span className={styles[s]}>{t(`scenarios.${s}`)}</span>,
    href: onChange ? undefined : CALCULATOR_PATH_BY_SCENARIO[s],
  }));

  return (
    <ButtonGroup
      className={c(styles.scenarioPicker, styles[`${selected}Selected`])}
      options={options}
      selected={selected}
      onChange={onChange}
    />
  );
}
