import SkillCard from "@/components/SkillCard";
import styles from "./StageSkillCards.module.scss";

export default function StageSkillCards({ skillCardIds }) {
  return (
    <div className={styles.stageSkillCards}>
      {skillCardIds.map((skillCardId, index) => (
        <SkillCard
          key={`${index}_${skillCardId}`}
          skillCardId={skillCardId}
          index={[0, index]}
        />
      ))}
    </div>
  );
}
