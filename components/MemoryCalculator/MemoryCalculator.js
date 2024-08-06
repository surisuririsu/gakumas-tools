import React, { useContext, useState } from "react";
import EntityIcon from "@/components/EntityIcon";
import IconSelect from "@/components/IconSelect";
import MemoryCalculatorResult from "@/components/MemoryCalculatorResult";
import TargetSkillCards from "@/components/TargetSkillCards";
import Trash from "@/components/Trash";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import { EntityTypes } from "@/utils/entities";
import {
  COST_RANGES_BY_RANK,
  generatePossibleMemories,
} from "@/utils/skillCardLottery";
import styles from "./MemoryCalculator.module.scss";

const RANKS = ["B", "B+", "A", "A+", "S"];

export default function MemoryCalculator() {
  const { targetSkillCardIds, alternateSkillCardIds, acquiredSkillCardIds } =
    useContext(MemoryCalculatorContext);
  const [rank, setRank] = useState("A");
  const costRange = COST_RANGES_BY_RANK[rank];

  const possibleMemories = generatePossibleMemories(acquiredSkillCardIds, rank);
  const {
    onTargetMemories,
    offTargetMemories,
    onTargetProbability,
    offTargetProbability,
  } = possibleMemories.reduce(
    (acc, cur) => {
      // Generates all combinations of target cards
      function generateCombinations(slots) {
        if (slots.length === 0) {
          return [[]];
        }
        const restCombos = generateCombinations(slots.slice(1));
        return slots[0].reduce(
          (acc, cur) => acc.concat(restCombos.map((c) => c.concat(cur))),
          []
        );
      }
      const slots = targetSkillCardIds
        .map((id, idx) =>
          [id].concat(alternateSkillCardIds[idx] || []).filter((mid) => mid)
        )
        .filter((slot) => slot.length);

      // Combos excluding those with duplicate cards
      const matchingCombinations = generateCombinations(slots).filter(
        (combo) => new Set(combo).size == combo.length
      );
      const memoryIsOnTarget = matchingCombinations.some((combo) =>
        combo.every((id) => cur.skillCardIds.includes(id))
      );

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

  return (
    <div className={styles.memoryCalculator}>
      <b>This feature is a work-in-progress! Accuracy is not guaranteed.</b>
      <label>Target skill cards</label>
      <TargetSkillCards />
      <label>Acquired skill cards</label>
      <div className={styles.skillCards}>
        {acquiredSkillCardIds.map((skillCardId, index) => (
          <EntityIcon
            key={`${index}_${skillCardId}`}
            type={EntityTypes.SKILL_CARD}
            id={skillCardId}
            widget="memoryCalculator:acquired"
            index={index}
          />
        ))}
      </div>
      <Trash />
      <label>Produce rank</label>
      <div className={styles.rankSelect}>
        <IconSelect
          options={RANKS.map((r) => ({
            id: r,
            iconSrc: `/ranks/${r}.png`,
          }))}
          selected={rank}
          onChange={setRank}
        />
      </div>
      <label>Cost range</label>
      <div>
        {costRange.min} ~ {costRange.max}
      </div>
      <label>
        On-target memories ({(onTargetProbability * 100).toFixed(2)}%)
      </label>
      {onTargetMemories.map(({ skillCardIds, probability }) => (
        <MemoryCalculatorResult
          key={skillCardIds}
          skillCardIds={skillCardIds}
          probability={probability}
        />
      ))}
      <label>
        Off-target memories ({(offTargetProbability * 100).toFixed(2)}%)
      </label>
      {offTargetMemories.map(({ skillCardIds, probability }) => (
        <MemoryCalculatorResult
          key={skillCardIds}
          skillCardIds={skillCardIds}
          probability={probability}
        />
      ))}
    </div>
  );
}
