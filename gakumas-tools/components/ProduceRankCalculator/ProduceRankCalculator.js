"use client";
import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import HajimeCalculator from "./HajimeCalculator";
import NiaCalculator from "./NiaCalculator";
import LessonCalculator from "../LessonCalculator";
import styles from "./ProduceRankCalculator.module.scss";

function ProduceRankCalculator() {
  const t = useTranslations("Calculator");

  const SCENARIO_OPTIONS = useMemo(
    () =>
      ["hajime", "nia"].map((scenario) => ({
        value: scenario,
        label: t(`scenarios.${scenario}`),
      })),
    [t]
  );

  const CALCULATOR_OPTIONS = useMemo(
    () =>
      ["produce-rank", "lesson"].map((calculator) => ({
        value: calculator,
        label: t(`calculators.${calculator}`),
      })),
    [t]
  );

  const [scenario, setScenario] = useState("nia");
  const [calculator, setCalculator] = useState("produce-rank");

  return (
    <div className={styles.produceRankCalculator}>
      <label>{t("scenario")}</label>
      <ButtonGroup
        options={SCENARIO_OPTIONS}
        selected={scenario}
        onChange={setScenario}
      />

      {scenario == "hajime" && (
        <>
          <label>{t("calculator")}</label>
          <ButtonGroup
            options={CALCULATOR_OPTIONS}
            selected={calculator}
            onChange={setCalculator}
          />
        </>
      )}
      {scenario == "nia" ? (
        <NiaCalculator />
      ) : calculator == "produce-rank" ? (
        <HajimeCalculator />
      ) : (
        <LessonCalculator />
      )}
    </div>
  );
}

export default memo(ProduceRankCalculator);
