import { memo, useContext, useMemo, useState } from "react";
import {
  FaCirclePlus,
  FaCircleArrowUp,
  FaCircleArrowDown,
  FaCircleXmark,
  FaEllipsis,
  FaFilm,
} from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import MemoryPickerModal from "@/components/MemoryPickerModal";
import StageSkillCards from "@/components/StageSkillCards";
import LoadoutContext from "@/contexts/LoadoutContext";
import ModalContext from "@/contexts/ModalContext";
import c from "@/utils/classNames";
import styles from "./LoadoutSkillCardGroup.module.scss";

function LoadoutSkillCardGroup({ skillCardIds, groupIndex, idolId }) {
  const {
    skillCardIdGroups,
    replaceSkillCardId,
    insertSkillCardIdGroup,
    deleteSkillCardIdGroup,
    swapSkillCardIdGroups,
  } = useContext(LoadoutContext);
  const { setModal } = useContext(ModalContext);
  const [expanded, setExpanded] = useState(false);

  const cost = useMemo(
    () =>
      skillCardIds
        .filter((id) => id)
        .map(SkillCards.getById)
        .reduce(
          (acc, cur) =>
            acc + (cur.sourceType == "pIdol" ? 0 : cur.contestPower),
          0
        ),
    [skillCardIds]
  );

  return (
    <div>
      <StageSkillCards
        skillCardIds={skillCardIds}
        replaceSkillCardId={replaceSkillCardId}
        idolId={idolId}
        groupIndex={groupIndex}
      />

      <div className={styles.sub}>
        <div className={styles.cost}>コスト: {cost}</div>
        <div
          className={c(styles.buttonGroup, expanded && styles.expanded)}
          onClick={() => setExpanded(false)}
        >
          <button
            className={styles.pickButton}
            onClick={() => setModal(<MemoryPickerModal index={groupIndex} />)}
          >
            <FaFilm />
          </button>

          <button
            className={styles.addButton}
            onClick={() => insertSkillCardIdGroup(groupIndex + 1)}
          >
            <FaCirclePlus />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => swapSkillCardIdGroups(groupIndex, groupIndex - 1)}
            disabled={groupIndex < 1}
          >
            <FaCircleArrowUp />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => swapSkillCardIdGroups(groupIndex, groupIndex + 1)}
            disabled={groupIndex >= skillCardIdGroups.length - 1}
          >
            <FaCircleArrowDown />
          </button>

          <button
            className={styles.deleteButton}
            onClick={() => deleteSkillCardIdGroup(groupIndex)}
            disabled={skillCardIdGroups.length < 2}
          >
            <FaCircleXmark />
          </button>
        </div>
        <button
          className={styles.expandButton}
          onClick={(e) => {
            setExpanded(!expanded);
            e.stopPropagation();
          }}
        >
          <FaEllipsis />
        </button>
      </div>
    </div>
  );
}

export default memo(LoadoutSkillCardGroup);
