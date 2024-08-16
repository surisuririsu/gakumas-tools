import { memo, useContext } from "react";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import Checkbox from "@/components/Checkbox";
import EntityIcon from "@/components/EntityIcon";
import PlanIdolSelects from "@/components/PlanIdolSelects";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { EntityTypes } from "@/utils/entities";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./EntityBank.module.scss";

function EntityBank({ type, onClick, filters = {}, includeNull = true }) {
  const { filter, setFilter, plan, setPlan, idolId, setIdolId } =
    useContext(WorkspaceContext);

  let entities = [];
  const Entities = type == EntityTypes.SKILL_CARD ? SkillCards : PItems;
  const compareFn =
    type == EntityTypes.SKILL_CARD ? compareSkillCards : comparePItems;

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
      ...filters,
    }).sort(compareFn);
    entities = signatureEntities.concat(nonSignatureEntities);
  } else {
    entities = Entities.getAll().sort(compareFn);
  }

  if (includeNull) {
    entities = [{}, ...entities];
  }

  return (
    <>
      <div className={styles.entities}>
        {entities.map((entity) => (
          <EntityIcon
            key={`${type}_${entity.id}`}
            type={type}
            id={entity.id}
            idolId={idolId}
            onClick={() => onClick(entity)}
            size="fill"
          />
        ))}
      </div>

      <div className={styles.filter}>
        <Checkbox label="フィルタ" checked={filter} onChange={setFilter} />
      </div>

      {filter && (
        <PlanIdolSelects
          plan={plan}
          idolId={idolId}
          setPlan={setPlan}
          setIdolId={setIdolId}
        />
      )}
    </>
  );
}

export default memo(EntityBank);
