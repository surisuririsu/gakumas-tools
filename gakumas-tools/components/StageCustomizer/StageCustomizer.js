import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  serializeEffectSequence,
  deserializeEffectSequence,
} from "gakumas-data";
import Button from "@/components/Button";
import ParametersInput from "@/components/ParametersInput";
import styles from "./StageCustomizer.module.scss";
import ButtonGroup from "../ButtonGroup";

function normalizeCriteria(criteria) {
  const nums = criteria.map((c) => c || 0);
  return {
    vocal: nums[0],
    dance: nums[1],
    visual: nums[2],
  };
}

function normalizeFirstTurns(firstTurns) {
  const nums = firstTurns.map((c) => c || 0);
  const total = nums[0] + nums[1] + nums[2] || 1;
  return {
    vocal: Math.round((100 * nums[0]) / total) / 100,
    dance: Math.round((100 * nums[1]) / total) / 100,
    visual: Math.round((100 * nums[2]) / total) / 100,
  };
}

function StageCustomizer({ initialStage, onApply }) {
  const t = useTranslations("StageCustomizer");

  const [turnCounts, setTurnCounts] = useState(
    Object.values(initialStage.turnCounts)
  );
  const [firstTurns, setFirstTurns] = useState(
    Object.values(initialStage.firstTurns)
  );
  const [criteria, setCriteria] = useState(
    Object.values(initialStage.criteria)
  );
  const [effects, setEffects] = useState(
    serializeEffectSequence(initialStage.effects).replaceAll(";", ";\n")
  );
  const [defaultCardSet, setDefaultCardSet] = useState(
    initialStage.defaultCardSet || initialStage.type
  );

  const DEFAULT_CARD_SET_OPTIONS = [
    { value: "contest", label: t("contest") },
    { value: "event", label: t("event") },
  ];

  function apply() {
    onApply({
      id: "custom",
      type: "custom",
      plan: "free",
      turnCounts: {
        vocal: turnCounts[0] || 0,
        dance: turnCounts[1] || 0,
        visual: turnCounts[2] || 0,
      },
      firstTurns: normalizeFirstTurns(firstTurns),
      criteria: normalizeCriteria(criteria),
      effects: deserializeEffectSequence(effects.replace(/\s/g, "")),
      defaultCardSet,
    });
  }

  return (
    <div className={styles.stageCustomizer}>
      <label>{t("turnCounts")}</label>
      <ParametersInput
        parameters={turnCounts}
        onChange={setTurnCounts}
        max={100}
      />

      <label>{t("firstTurn")}</label>
      <ParametersInput
        parameters={firstTurns}
        onChange={setFirstTurns}
        max={100}
        round={false}
      />

      <label>{t("criteria")}</label>
      <ParametersInput
        parameters={criteria}
        onChange={setCriteria}
        max={100}
        round={false}
      />

      <label>{t("effects")}</label>
      <div className={styles.effects}>
        <textarea
          defaultValue={effects}
          onChange={(e) => setEffects(e.target.value)}
        />
        <a
          href="https://github.com/surisuririsu/gakumas-tools/blob/master/packages/gakumas-data/Effects.md"
          target="_blank"
        >
          {t("effectFormat")}
        </a>
      </div>

      <label>{t("defaultCards")}</label>
      <ButtonGroup
        selected={defaultCardSet}
        options={DEFAULT_CARD_SET_OPTIONS}
        onChange={setDefaultCardSet}
      />

      <Button className={styles.apply} style="primary" onClick={apply}>
        {t("apply")}
      </Button>
    </div>
  );
}

export default memo(StageCustomizer);
