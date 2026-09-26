"use client";
import { memo, useState } from "react";
import ScenarioPicker from "@/components/ScenarioPicker";
import CalculatorSwitch from "./CalculatorSwitch";
import HajimeCalculator from "./HajimeCalculator";
import HifCalculator from "./HifCalculator";
import NiaCalculator from "./NiaCalculator";
import LessonCalculator from "../LessonCalculator";
import styles from "./ProduceRankCalculator.module.scss";

function ProduceRankCalculator() {
  const [scenario, setScenario] = useState("hif");
  const [calculator, setCalculator] = useState("produce-rank");

  return (
    <div className={styles.produceRankCalculator}>
      <ScenarioPicker selected={scenario} onChange={setScenario} />

      {scenario === "hajime" && (
        <CalculatorSwitch selected={calculator} onChange={setCalculator} />
      )}
      {scenario === "nia" ? (
        <NiaCalculator />
      ) : scenario === "hif" ? (
        <HifCalculator />
      ) : calculator === "produce-rank" ? (
        <HajimeCalculator />
      ) : (
        <LessonCalculator />
      )}
    </div>
  );
}

export default memo(ProduceRankCalculator);
