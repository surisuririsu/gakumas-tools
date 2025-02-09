import { memo, useContext } from "react";
import EntityIcon from "@/components/EntityIcon";
import EntityPickerModal from "@/components/EntityPickerModal";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import ModalContext from "@/contexts/ModalContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./AcquiredSkillCards.module.scss";

function AcquiredSkillCards() {
  const { acquiredSkillCardIds, replaceAcquiredCardId } = useContext(
    MemoryCalculatorContext
  );
  const { setModal } = useContext(ModalContext);
  const { idolId } = useContext(WorkspaceContext);

  return (
    <div className={styles.skillCards}>
      {acquiredSkillCardIds.map((skillCardId, index) => (
        <EntityIcon
          key={`${index}_${skillCardId}`}
          type={EntityTypes.SKILL_CARD}
          id={skillCardId}
          onClick={() =>
            setModal(
              <EntityPickerModal
                type={EntityTypes.SKILL_CARD}
                onPick={(card) => replaceAcquiredCardId(index, card.id)}
                filters={[
                  {
                    callback: (e) => e.sourceType != "pIdol",
                  },
                ]}
              />
            )
          }
          idolId={idolId}
          showTier
        />
      ))}
    </div>
  );
}

export default memo(AcquiredSkillCards);
