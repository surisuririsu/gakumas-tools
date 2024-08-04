import Image from "next/image";
import { SkillCards } from "gakumas-data";
import { calculateSkillCardCost } from "@/utils/contestPower";
import styles from "./MemoryCalculatorResult.module.scss";

export default function MemoryCalculatorResult({ skillCardIds, probability }) {
  return (
    <div className={styles.result}>
      <div className={styles.cards}>
        {skillCardIds.map(SkillCards.getById).map(({ id, icon, name }) => (
          <Image key={id} src={icon} width={60} alt={name} draggable={false} />
        ))}
        {calculateSkillCardCost(skillCardIds)}
      </div>
      <div>{(probability * 100).toFixed(2)}%</div>
    </div>
  );
}
