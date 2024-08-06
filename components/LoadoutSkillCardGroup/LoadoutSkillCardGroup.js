import { useContext } from "react";
import {
  FaCirclePlus,
  FaCircleArrowUp,
  FaCircleArrowDown,
  FaCircleXmark,
} from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import StageSkillCards from "@/components/StageSkillCards";
import EntityContext from "@/contexts/EntityContext";
import LoadoutContext from "@/contexts/LoadoutContext";
import styles from "./LoadoutSkillCardGroup.module.scss";

export default function LoadoutSkillCardGroup({ skillCardIds, groupIndex }) {
  const { setSelectedEntity } = useContext(EntityContext);
  const {
    idolId,
    skillCardIdGroups,
    insertSkillCardIdGroup,
    deleteSkillCardIdGroup,
    swapSkillCardIdGroups,
  } = useContext(LoadoutContext);

  const cost = skillCardIds
    .filter((id) => id)
    .map(SkillCards.getById)
    .reduce(
      (acc, cur) => acc + (cur.sourceType == "pIdol" ? 0 : cur.contestPower),
      0
    );

  return (
    <div className={styles.loadoutSkillCardGroup}>
      <StageSkillCards
        skillCardIds={skillCardIds}
        region="loadoutEditor"
        idolId={idolId}
        groupIndex={groupIndex}
      />

      <div className={styles.sub}>
        <div>Cost: {cost}</div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedEntity(null);
              insertSkillCardIdGroup(groupIndex + 1);
            }}
          >
            <FaCirclePlus />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => {
              setSelectedEntity(null);
              swapSkillCardIdGroups(groupIndex, groupIndex - 1);
            }}
            disabled={groupIndex < 1}
          >
            <FaCircleArrowUp />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => {
              setSelectedEntity(null);
              swapSkillCardIdGroups(groupIndex, groupIndex + 1);
            }}
            disabled={groupIndex >= skillCardIdGroups.length - 1}
          >
            <FaCircleArrowDown />
          </button>

          <button
            className={styles.deleteButton}
            onClick={() => {
              setSelectedEntity(null);
              deleteSkillCardIdGroup(groupIndex);
            }}
            disabled={skillCardIdGroups.length < 2}
          >
            <FaCircleXmark />
          </button>
        </div>
      </div>
    </div>
  );
}
