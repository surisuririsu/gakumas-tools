import { useContext } from "react";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./StageSkillCards.module.scss";

export default function StageSkillCards({
  skillCardIds,
  replaceSkillCardId,
  idolId,
  size,
  groupIndex = 0,
}) {
  const { pickSkillCardModal } = useContext(ModalContext);

  return (
    <div className={styles.stageSkillCards}>
      {skillCardIds.map((skillCardId, index) => (
        <EntityIcon
          key={`${index}_${skillCardId}`}
          type={EntityTypes.SKILL_CARD}
          id={skillCardId}
          onClick={() =>
            pickSkillCardModal((entity) =>
              replaceSkillCardId(groupIndex * 6 + index, entity.id)
            )
          }
          idolId={idolId}
          size={size}
        />
      ))}
    </div>
  );
}
