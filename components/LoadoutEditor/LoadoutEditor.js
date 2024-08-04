import { useContext } from "react";
import { Idols } from "gakumas-data";
import IconSelect from "@/components/IconSelect";
import LoadoutSkillCardGroup from "@/components/LoadoutSkillCardGroup";
import StagePItems from "@/components/StagePItems";
import Trash from "@/components/Trash";
import LoadoutContext from "@/contexts/LoadoutContext";
import { PLANS } from "@/utils/plans";
import styles from "./LoadoutEditor.module.scss";

export default function LoadoutEditor() {
  const { plan, setPlan, idolId, setIdolId, pItemIds, skillCardIdGroups } =
    useContext(LoadoutContext);

  return (
    <div className={styles.loadoutEditor}>
      <div className={styles.filters}>
        <IconSelect
          options={PLANS.map((alias) => ({
            id: alias,
            iconSrc: `/plans/${alias}.png`,
          }))}
          selected={plan}
          onChange={setPlan}
        />
        <IconSelect
          options={Idols.getAll().map(({ id, icon }) => ({
            id,
            iconSrc: icon,
          }))}
          selected={idolId}
          onChange={setIdolId}
        />
      </div>
      <label>P-items</label>
      <StagePItems pItemIds={pItemIds} widget="loadoutEditor" size="small" />
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
