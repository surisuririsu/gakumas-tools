import { useContext, useEffect, useState } from "react";
import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import EntityDetails from "@/components/EntityDetails";
import EntityIcon from "@/components/EntityIcon";
import IconSelect from "@/components/IconSelect";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { EntityTypes } from "@/utils/entities";
import { PLANS } from "@/utils/plans";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./Dex.module.scss";

export default function Dex() {
  const { filter, setFilter, plan, setPlan, idolId, setIdolId } =
    useContext(WorkspaceContext);
  const { pIdolId } = useContext(MemoryContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);
  const [activeTab, setActiveTab] = useState("Skill cards");

  useEffect(() => {
    setSelectedEntity(null);
  }, [filter]);

  useEffect(() => {
    const pIdol = PIdols.getById(pIdolId);
    if (pIdol) {
      setPlan(pIdol.plan);
      setIdolId(pIdol.idolId);
    }
  }, [pIdolId]);

  let entities = [];
  const Entities = activeTab == "Skill cards" ? SkillCards : PItems;
  const compareFn =
    activeTab == "Skill cards" ? compareSkillCards : comparePItems;

  if (filter) {
    const pIdolIds = PIdols.getFiltered({
      idolIds: [idolId],
      plans: [plan],
    }).map((pi) => pi.id);
    const signatureEntities = Entities.getFiltered({
      pIdolIds,
    });
    const nonSignatureEntities = Entities.getFiltered({
      rarities: ["R", "SR", "SSR"],
      plans: [plan, "free"],
      modes: ["stage"],
      sourceTypes: ["produce", "support"],
    }).sort(compareFn);
    entities = signatureEntities.concat(nonSignatureEntities);
  } else {
    entities = Entities.getAll().sort(compareFn);
  }

  return (
    <div className={styles.dex}>
      <div className={styles.details}>
        <EntityDetails type={selectedEntity?.type} id={selectedEntity?.id} />
      </div>

      <div className={styles.result}>
        {entities.map((entity, index) => (
          <EntityIcon
            key={`${entity.type}_${entity.id}`}
            type={
              activeTab == "Skill cards"
                ? EntityTypes.SKILL_CARD
                : EntityTypes.P_ITEM
            }
            id={entity.id}
            widget="dex"
            index={index}
            idolId={idolId}
          />
        ))}
      </div>

      <div className={styles.filter}>
        <Checkbox label="Filter" checked={filter} onChange={setFilter} />
      </div>

      {filter && (
        <div className={styles.selects}>
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
      )}

      <div className={styles.tabs}>
        <ButtonGroup
          selected={activeTab}
          options={["Skill cards", "P-items"]}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
}
