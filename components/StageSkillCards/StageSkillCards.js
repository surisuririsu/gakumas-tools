import EntityIcon from "@/components/EntityIcon";
import { EntityTypes } from "@/utils/entities";
import styles from "./StageSkillCards.module.scss";

export default function StageSkillCards({
  skillCardIds,
  widget,
  idolId,
  size,
  groupIndex = 0,
}) {
  return (
    <div className={styles.stageSkillCards}>
      {skillCardIds.map((skillCardId, index) => (
        <EntityIcon
          key={`${index}_${skillCardId}`}
          type={EntityTypes.SKILL_CARD}
          id={skillCardId}
          widget={widget}
          index={groupIndex * 6 + index}
          idolId={idolId}
          size={size}
        />
      ))}
    </div>
  );
}
