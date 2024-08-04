import { useContext, useState } from "react";
import Image from "next/image";
import EntityIcon from "@/components/EntityIcon";
import IconSelect from "@/components/IconSelect";
import MemoryCalculatorResult from "@/components/MemoryCalculatorResult";
import Trash from "@/components/Trash";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import { EntityTypes } from "@/utils/entities";
import {
  COST_RANGES_BY_RANK,
  generatePossibleMemories,
} from "@/utils/skillCardLottery";
import styles from "./MemoryCalculator.module.scss";
import { calculateSkillCardCost } from "@/utils/contestPower";

const RANKS = ["B", "B+", "A", "A+", "S"];

export default function MemoryCalculator() {
  const { targetSkillCardIds, acquiredSkillCardIds } = useContext(
    MemoryCalculatorContext
  );
  const [rank, setRank] = useState("A");
  const costRange = COST_RANGES_BY_RANK[rank];
  const possibleMemories = generatePossibleMemories(acquiredSkillCardIds, rank);
  const targetSet = new Set(targetSkillCardIds.filter((id) => id));
  const {
    onTargetMemories,
    offTargetMemories,
    onTargetProbability,
    offTargetProbability,
  } = possibleMemories.reduce(
    (acc, cur) => {
      if (targetSet.isSubsetOf(new Set(cur.skillCardIds))) {
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
      <div className={styles.skillCards}>
        {targetSkillCardIds.map((skillCardId, index) => (
          <EntityIcon
            key={`${index}_${skillCardId}`}
            type={EntityTypes.SKILL_CARD}
            id={skillCardId}
            widget="memoryCalculator:target"
            index={index}
          />
        ))}
      </div>
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
