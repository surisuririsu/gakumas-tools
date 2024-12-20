import { memo, useContext } from "react";
import EntityIcon from "@/components/EntityIcon";
import ModalContext from "@/contexts/ModalContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./StageSkillCards.module.scss";
import EntityPickerModal from "../EntityPickerModal";

function StageSkillCards({
  skillCardIds,
  customizations,
  replaceSkillCardId,
  replaceCustomizations,
  idolId,
  size,
  groupIndex = 0,
}) {
  const { setModal } = useContext(ModalContext);

  return (
    <div className={styles.stageSkillCards}>
      {skillCardIds.map((skillCardId, index) => (
        <EntityIcon
          key={`${index}_${skillCardId}`}
          type={EntityTypes.SKILL_CARD}
          id={skillCardId}
          numCustomizations={customizations?.[index].length}
          onClick={() =>
            setModal(
              <EntityPickerModal
                type={EntityTypes.SKILL_CARD}
                id={skillCardId}
                customizations={customizations?.[index]}
                onPick={(card) =>
                  replaceSkillCardId(groupIndex * 6 + index, card.id)
                }
                onCustomize={(customs) =>
                  replaceCustomizations(groupIndex * 6 + index, customs)
                }
              />
            )
          }
          idolId={idolId}
          size={size}
        />
      ))}
    </div>
  );
}

export default memo(StageSkillCards);
