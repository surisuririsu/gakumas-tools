import { useContext } from "react";
import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";
import Checkbox from "@/components/Checkbox";
import EntityIcon from "@/components/EntityIcon";
import IconSelect from "@/components/IconSelect";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { EntityTypes } from "@/utils/entities";
import { PLANS } from "@/utils/plans";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./EntityBank.module.scss";

export default function EntityBank({
  type,
  onClick,
  filters = {},
  includeNull = true,
}) {
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
    entities.unshift({});
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
        <div className={styles.selects}>
          <IconSelect
            options={PLANS.map((alias) => ({
              id: alias,
              iconSrc: `/plans/${alias}.png`,
              alt: alias,
            }))}
            selected={plan}
            onChange={setPlan}
          />
          <IconSelect
            options={Idols.getAll().map(({ id, name, icon }) => ({
              id,
              iconSrc: icon,
              alt: name,
            }))}
            selected={idolId}
            onChange={setIdolId}
          />
        </div>
      )}
    </>
  );
}
