"use client";
import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import ScenarioPicker from "@/components/ScenarioPicker";
import HajimeCalculator from "./HajimeCalculator";
import NiaCalculator from "./NiaCalculator";
import LessonCalculator from "../LessonCalculator";
import styles from "./ProduceRankCalculator.module.scss";

function ProduceRankCalculator() {
  const t = useTranslations("Calculator");

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
      <ScenarioPicker selected={scenario} onChange={setScenario} />

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
