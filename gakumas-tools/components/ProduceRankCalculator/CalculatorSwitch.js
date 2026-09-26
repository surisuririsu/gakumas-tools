import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import styles from "./CalculatorSwitch.module.scss";

const CALCULATORS = ["produce-rank", "lesson"];

export default function CalculatorSwitch({ selected, onChange }) {
  const t = useTranslations("Calculator");

  const options = CALCULATORS.map((calculator) => ({
    value: calculator,
    label: t(`calculators.${calculator}`),
    href: onChange ? undefined : `/calculator/hajime/${calculator}`,
  }));

  return (
    <ButtonGroup
      className={styles.calculatorSwitch}
      options={options}
      selected={selected}
      onChange={onChange}
    />
  );
}
