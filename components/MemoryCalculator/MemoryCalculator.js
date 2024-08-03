import { useContext, useState } from "react";
import Image from "next/image";
import EntityIcon from "@/components/EntityIcon";
import IconSelect from "@/components/IconSelect";
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
  const { skillCardIds } = useContext(MemoryCalculatorContext);
  const [rank, setRank] = useState("A");
  const costRange = COST_RANGES_BY_RANK[rank];
  const possibleMemories = generatePossibleMemories(skillCardIds, rank);

  return (
    <div className={styles.memoryCalculator}>
      <label>Acquired skill cards</label>
      <div className={styles.acquiredSkillCards}>
        {skillCardIds.map((skillCardId, index) => (
          <EntityIcon
            key={`${index}_${skillCardId}`}
            type={EntityTypes.SKILL_CARD}
            id={skillCardId}
            widget="memoryCalculator"
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
      <label>Possible memories</label>
      {possibleMemories.map((memory) => (
        <div
          key={JSON.stringify(memory.map(({ id }) => id))}
          className={styles.memory}
        >
          {memory.map((skillCard) => (
            <Image
              key={skillCard.id}
              src={skillCard.icon}
              width={60}
              alt={skillCard.name}
              draggable={false}
            />
          ))}
          {calculateSkillCardCost(memory.map(({ id }) => id))}
        </div>
      ))}
    </div>
  );
}
