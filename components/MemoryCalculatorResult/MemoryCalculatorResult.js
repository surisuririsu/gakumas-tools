import Image from "next/image";
import { SkillCards } from "gakumas-data";
import { calculateSkillCardCost } from "@/utils/contestPower";
import styles from "./MemoryCalculatorResult.module.scss";

export default function MemoryCalculatorResult({
  skillCardIds,
  probability,
  idolId,
}) {
  return (
    <div className={styles.result}>
      {skillCardIds
        .map(SkillCards.getById)
        .map(({ id, icon, getDynamicIcon, name }) => (
          <div key={id} className={styles.card}>
            <Image
              src={getDynamicIcon?.(idolId) || icon}
              fill
              sizes="64px"
              alt={name}
              draggable={false}
            />
          </div>
        ))}
      {calculateSkillCardCost(skillCardIds)}
      <span>({(probability * 100).toFixed(2)}%)</span>
    </div>
  );
}
