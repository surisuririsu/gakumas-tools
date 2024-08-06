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
      <div className={styles.cards}>
        {skillCardIds
          .map(SkillCards.getById)
          .map(({ id, icon, getDynamicIcon, name }) => (
            <Image
              key={id}
              src={getDynamicIcon?.(idolId) || icon}
              width={60}
              alt={name}
              draggable={false}
            />
          ))}
        {calculateSkillCardCost(skillCardIds)}
      </div>
      <div>{(probability * 100).toFixed(2)}%</div>
    </div>
  );
}
