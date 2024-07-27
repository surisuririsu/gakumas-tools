import EntityIcon from "@/components/EntityIcon";
import { EntityTypes } from "@/utils/entities";
import styles from "./StageSkillCards.module.scss";

export default function StageSkillCards({
  skillCardIds,
  widget,
  idolId,
  size,
}) {
  return (
    <div className={styles.stageSkillCards}>
      {skillCardIds.map((skillCardId, index) => (
        <EntityIcon
          key={`${index}_${skillCardId}`}
          type={EntityTypes.SKILL_CARD}
          id={skillCardId}
          widget={widget}
          index={index}
          idolId={idolId}
          size={size}
        />
      ))}
    </div>
  );
}
