"use client";
import { memo, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";
import IconSelect from "@/components/IconSelect";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
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
  } = useContext(MemoryCalculatorContext);
  const { idolId } = useContext(WorkspaceContext);
  const [showOnTargetResults, setShowOnTargetResults] = useState(true);
  const [showOffTargetResults, setShowOffTargetResults] = useState(false);

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
      <p>{t("note")}</p>

      <label>{t("target")}</label>
      <TargetSkillCards idolId={idolId} />

      <label>{t("acquired")}</label>
      <AcquiredSkillCards />

      <label>{t("produceRank")}</label>
      <div className={styles.rankSelect}>
        <IconSelect options={RANK_OPTIONS} selected={rank} onChange={setRank} />
      </div>

      <label>{t("costRange")}</label>
      <div>
        {costRange.min} ~ {costRange.max}
      </div>

      <button
        className={styles.resultsToggle}
        onClick={() => setShowOnTargetResults(!showOnTargetResults)}
      >
        <label>
          {t("success")} ({(onTargetProbability * 100).toFixed(2)}%)
        </label>
        {showOnTargetResults ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {showOnTargetResults && (
        <MemoryCalculatorResultList
          memories={onTargetMemories}
          idolId={idolId}
        />
      )}

      <button
        className={styles.resultsToggle}
        onClick={() => setShowOffTargetResults(!showOffTargetResults)}
      >
        <label>
          {t("failure")} ({(offTargetProbability * 100).toFixed(2)}%)
        </label>
        {showOffTargetResults ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {showOffTargetResults && (
        <MemoryCalculatorResultList
          memories={offTargetMemories}
          idolId={idolId}
        />
      )}
    </div>
  );
}

export default memo(MemoryCalculator);
