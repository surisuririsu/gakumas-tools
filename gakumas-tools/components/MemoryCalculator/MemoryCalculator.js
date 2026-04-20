"use client";
import { memo, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
import ConfirmModal from "@/components/ConfirmModal";
import IconSelect from "@/components/IconSelect";
import Panel from "@/components/Panel";
import TabGroup from "@/components/TabGroup";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import ModalContext from "@/contexts/ModalContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { COST_RANGES, COST_RANGES_BY_RANK } from "@/utils/contestPower";
import {
  classifyMemories,
  generatePossibleMemories,
} from "@/utils/skillCardLottery";
import AcquiredSkillCards from "./AcquiredSkillCards";
import DraftPick from "./DraftPick";
import MemoryCalculatorResultList from "./MemoryCalculatorResultList";
import TargetSkillCards from "./TargetSkillCards";
import styles from "./MemoryCalculator.module.scss";

const RANK_OPTIONS = COST_RANGES.toReversed().map(({ rank }) => ({
  id: rank,
  iconSrc: `/ranks/${rank}.png`,
  alt: rank,
}));

function MemoryCalculator() {
  const t = useTranslations("MemoryCalculator");

  const {
    targetSkillCardIds,
    alternateSkillCardIds,
    targetNegations,
    acquiredSkillCardIds,
    rank,
    setRank,
    clearTargetCardIds,
    clearAcquiredCardIds,
  } = useContext(MemoryCalculatorContext);
  const { idolId } = useContext(WorkspaceContext);
  const { setModal } = useContext(ModalContext);
  const [resultsTab, setResultsTab] = useState("success");

  const confirmClear = (onConfirm) =>
    setModal(<ConfirmModal message={t("confirm")} onConfirm={onConfirm} />);

  const costRange = COST_RANGES_BY_RANK[rank];

  const possibleMemories = useMemo(
    () => generatePossibleMemories(acquiredSkillCardIds, rank),
    [acquiredSkillCardIds, rank],
  );
  const {
    onTargetMemories,
    offTargetMemories,
    onTargetProbability,
    offTargetProbability,
  } = useMemo(
    () =>
      classifyMemories(possibleMemories, {
        targetSkillCardIds,
        alternateSkillCardIds,
        targetNegations,
      }),
    [
      possibleMemories,
      targetSkillCardIds,
      alternateSkillCardIds,
      targetNegations,
    ],
  );

  return (
    <div className={styles.memoryCalculator}>
      <Alert>{t("note")}</Alert>

      <Panel
        label={t("target")}
        headerAction={
          <Button
            style="red-secondary"
            size="sm"
            pill
            onClick={() => confirmClear(clearTargetCardIds)}
          >
            {t("clear")}
          </Button>
        }
      >
        <TargetSkillCards idolId={idolId} />
      </Panel>

      <Panel
        label={t("acquired")}
        info={t("acquiredInfo")}
        headerAction={
          <Button
            style="red-secondary"
            size="sm"
            pill
            onClick={() => confirmClear(clearAcquiredCardIds)}
          >
            {t("clear")}
          </Button>
        }
      >
        <AcquiredSkillCards />
      </Panel>

      <DraftPick idolId={idolId} />

      <Panel label={t("produceRank")}>
        <div className={styles.settingsRow}>
          <IconSelect
            options={RANK_OPTIONS}
            selected={rank}
            onChange={setRank}
          />
          <div className={styles.settingField}>
            <label>{t("costRange")}</label>
            <div className={styles.costRange}>
              {costRange.min} ~ {costRange.max}
            </div>
          </div>
        </div>
      </Panel>

      <Panel noPadding className={styles.resultsPanel}>
        <TabGroup
          selected={resultsTab}
          onChange={setResultsTab}
          options={[
            {
              value: "success",
              label: `${t("success")} (${(onTargetProbability * 100).toFixed(2)}%)`,
            },
            {
              value: "failure",
              label: `${t("failure")} (${(offTargetProbability * 100).toFixed(2)}%)`,
            },
          ]}
        />
        <div className={styles.resultsContent}>
          <MemoryCalculatorResultList
            memories={
              resultsTab === "success" ? onTargetMemories : offTargetMemories
            }
            idolId={idolId}
          />
        </div>
      </Panel>
    </div>
  );
}

export default memo(MemoryCalculator);
