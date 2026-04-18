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
import { generatePossibleMemories } from "@/utils/skillCardLottery";
import AcquiredSkillCards from "./AcquiredSkillCards";
import MemoryCalculatorResultList from "./MemoryCalculatorResultList";
import TargetSkillCards from "./TargetSkillCards";
import styles from "./MemoryCalculator.module.scss";

const RANK_OPTIONS = COST_RANGES.toReversed().map(({ rank }) => ({
  id: rank,
  iconSrc: `/ranks/${rank}.png`,
  alt: rank,
}));

// Generates all combinations of target cards
function generateCombinations(slots) {
  if (slots.length === 0) return [[]];
  const restCombos = generateCombinations(slots.slice(1));
  return slots[0].reduce((acc, cur) => {
    for (let c of restCombos) {
      if (c.includes(cur)) continue;
      acc.push(c.concat(cur));
    }
    return acc;
  }, []);
}

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
    [acquiredSkillCardIds, rank]
  );
  const {
    onTargetMemories,
    offTargetMemories,
    onTargetProbability,
    offTargetProbability,
  } = useMemo(() => {
    // Cards for each slot
    let positiveSlots = [];
    let negativeSlots = [];
    for (let i in targetSkillCardIds) {
      const slot = [targetSkillCardIds[i]]
        .concat(alternateSkillCardIds[i] || [])
        .filter((id) => id);
      if (!slot.length) continue;
      if (targetNegations[i]) {
        negativeSlots.push(slot);
      } else {
        positiveSlots.push(slot);
      }
    }
    const excludedSkillCardIds = [].concat(...negativeSlots);

    // Combos excluding those with duplicate cards
    const matchingCombinations = generateCombinations(positiveSlots);

    return possibleMemories.reduce(
      (acc, cur) => {
        // Classify on/off-target
        const memoryIsOnTarget =
          matchingCombinations.some((combo) =>
            combo.every((id) => cur.skillCardIds.includes(id))
          ) &&
          !cur.skillCardIds.some((id) => excludedSkillCardIds.includes(id));

        if (memoryIsOnTarget) {
          acc.onTargetMemories.push(cur);
          acc.onTargetProbability += cur.probability;
        } else {
          acc.offTargetMemories.push(cur);
          acc.offTargetProbability += cur.probability;
        }

        return acc;
      },
      {
        onTargetMemories: [],
        offTargetMemories: [],
        onTargetProbability: 0,
        offTargetProbability: 0,
      }
    );
  }, [
    possibleMemories,
    targetSkillCardIds,
    alternateSkillCardIds,
    targetNegations,
  ]);

  return (
    <div className={styles.memoryCalculator}>
      <Alert>{t("note")}</Alert>

      <Panel
        label={t("target")}
        headerAction={
          <Button
            style="red-secondary"
            size="sm"
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
        headerAction={
          <Button
            style="red-secondary"
            size="sm"
            onClick={() => confirmClear(clearAcquiredCardIds)}
          >
            {t("clear")}
          </Button>
        }
      >
        <AcquiredSkillCards />
      </Panel>

      <Panel>
        <div className={styles.settingsRow}>
          <div className={styles.settingField}>
            <div className={styles.settingLabel}>{t("produceRank")}</div>
            <IconSelect
              options={RANK_OPTIONS}
              selected={rank}
              onChange={setRank}
            />
          </div>
          <div className={styles.settingField}>
            <div className={styles.settingLabel}>{t("costRange")}</div>
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
