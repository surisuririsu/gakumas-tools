import { useContext } from "react";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import StagePItems from "@/components/StagePItems";
import Trash from "@/components/Trash";
import LoadoutContext from "@/contexts/LoadoutContext";
import styles from "./LoadoutEditor.module.scss";

export default function LoadoutEditor() {
  const { pItemIds, skillCardIdGroups } = useContext(LoadoutContext);

  return (
    <div className={styles.loadoutEditor}>
      <label>P-items</label>
      <StagePItems pItemIds={pItemIds} region="loadoutEditor" size="small" />

      <label>Skill cards</label>
      {skillCardIdGroups.map((skillCardIdGroup, i) => (
        <LoadoutSkillCardGroup
          key={i}
          skillCardIds={skillCardIdGroup}
          groupIndex={i}
        />
      ))}

      <Trash />
    </div>
  );
}
