"use client";
import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import HajimeCalculator from "./HajimeCalculator";
import NiaCalculator from "./NiaCalculator";
import styles from "./ProduceRankCalculator.module.scss";

function ProduceRankCalculator() {
  const t = useTranslations("ProduceRankCalculator");

  const SCENARIO_OPTIONS = useMemo(
    () =>
      ["hajime", "nia"].map((scenario) => ({
        value: scenario,
        label: t(`scenarios.${scenario}`),
      })),
    [t]
  );

  const [scenario, setScenario] = useState("nia");

  return (
    <div className={styles.produceRankCalculator}>
      <label>{t("scenario")}</label>
      <ButtonGroup
        options={SCENARIO_OPTIONS}
        selected={scenario}
        onChange={setScenario}
      />

      {scenario == "nia" ? <NiaCalculator /> : <HajimeCalculator />}
    </div>
  );
}

export default memo(ProduceRankCalculator);
