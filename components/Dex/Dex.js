import { useContext, useEffect, useState } from "react";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import EntityDetails from "@/components/EntityDetails";
import EntityIcon from "@/components/EntityIcon";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryContext from "@/contexts/MemoryContext";
import SelectionContext from "@/contexts/SelectionContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { EntityTypes } from "@/utils/entities";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./Dex.module.scss";

export default function Dex() {
  const { openWidgets } = useContext(WorkspaceContext);
  const { pIdolId } = useContext(MemoryContext);
  const { plan, idolId } = useContext(LoadoutContext);
  const { selectedEntity, setSelectedEntity } = useContext(SelectionContext);
  const [activeTab, setActiveTab] = useState("Skill cards");
  const [filter, setFilter] = useState(true);

  useEffect(() => {
    setSelectedEntity(null);
  }, [filter]);

  const pIdol = PIdols.getById(pIdolId);

  let entities = [];
  const Entities = activeTab == "Skill cards" ? SkillCards : PItems;
  const compareFn =
    activeTab == "Skill cards" ? compareSkillCards : comparePItems;

  let pIdolIds = [];
  let plans = [];

  if (filter) {
    if (openWidgets.memoryEditor && pIdolId) {
      pIdolIds.push(pIdolId);
      plans.push(pIdol.plan);
    }
    if (openWidgets.loadoutEditor) {
      const filteredPIdols = PIdols.getFiltered({
        idolIds: [idolId],
        plans: [plan],
      });
      pIdolIds = pIdolIds.concat(filteredPIdols.map((pi) => pi.id));
      plans.push(plan);
    }
  }

  if (pIdolIds.length || plans.length) {
    const signatureEntities = Entities.getFiltered({
      pIdolIds,
    });
    const nonSignatureEntities = Entities.getFiltered({
      rarities: ["R", "SR", "SSR"],
      plans: [...plans, "free"],
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
            idolId={pIdol?.idolId}
          />
        ))}
      </div>
      {((openWidgets.memoryEditor && pIdolId) || openWidgets.loadoutEditor) && (
        <div className={styles.filter}>
          <Checkbox label="Filter" checked={filter} onChange={setFilter} />
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
