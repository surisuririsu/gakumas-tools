import { memo, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCheck, FaXmark } from "react-icons/fa6";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import Checkbox from "@/components/Checkbox";
import EntityIcon from "@/components/EntityIcon";
import PlanIdolSelects from "@/components/PlanIdolSelects";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import c from "@/utils/classNames";
import {
  COMPARE_FN_BY_TYPE,
  ENTITY_DATA_BY_TYPE,
  EntityTypes,
} from "@/utils/entities";
import styles from "./EntityBank.module.scss";

const HIDDEN_ITEM_IDS = [381];
const HIDDEN_CARD_IDS = [735, 738];

function EntityBank({ type, onClick, filters = [], includeNull = true }) {
  const t = useTranslations("EntityBank");

  const { filter, setFilter, plan, setPlan, idolId, setIdolId } =
    useContext(WorkspaceContext);
  const [enabledCustomFilters, setEnabledCustomFilters] = useState(
    filters.reduce(
      (acc, cur) => ({ ...acc, [cur.label]: !cur.label || cur.default }),
      {}
    )
  );

  let entities = [];
  const Entities = ENTITY_DATA_BY_TYPE[type];
  const compareFn = COMPARE_FN_BY_TYPE[type];

  if (filter) {
    let signatureEntities = [];
    if (type !== EntityTypes.P_DRINK) {
      const pIdolIds = PIdols.getFiltered({
        idolIds: [idolId],
        plans: [plan],
      }).map((pi) => pi.id);
      signatureEntities = Entities.getFiltered({
        pIdolIds,
      });
    }

    const nonSignatureEntities = Entities.getFiltered({
      rarities: ["N", "R", "SR", "SSR"],
      plans: [plan, "free"],
      modes: ["stage"],
      sourceTypes: ["default", "produce", "support"],
    }).sort(compareFn);

    entities = signatureEntities.concat(nonSignatureEntities);
  } else {
    entities = Entities.getAll().sort(compareFn);
  }

  // Hide unreleased entities
  if (type == EntityTypes.SKILL_CARD) {
    entities = entities.filter((e) => !HIDDEN_CARD_IDS.includes(e.id));
  } else if (type == EntityTypes.P_ITEM) {
    entities = entities.filter((e) => !HIDDEN_ITEM_IDS.includes(e.id));
  }

  for (let customFilter of filters) {
    if (!customFilter.label || enabledCustomFilters[customFilter.label]) {
      entities = entities.filter(customFilter.callback);
    }
  }

  if (includeNull) {
    entities = [{}, ...entities];
  }

  const toggleableFilters = useMemo(
    () => filters.filter((f) => f.label),
    [filters]
  );

  return (
    <>
      <div className={styles.entities}>
        {entities.map((entity) => (
          <EntityIcon
            key={`${type}_${entity.id}`}
            type={type}
            id={entity.id}
            idolId={idolId}
            onClick={onClick}
            size="fill"
            showTier
          />
        ))}
      </div>

      <div className={styles.filter}>
        <div className={styles.defaultFilters}>
          <Checkbox
            label={filter ? "" : t("filter")}
            checked={filter}
            onChange={setFilter}
          />

          {filter && (
            <PlanIdolSelects
              plan={plan}
              idolId={idolId}
              setPlan={setPlan}
              setIdolId={setIdolId}
            />
          )}
        </div>

        <div className={styles.customFilters}>
          {toggleableFilters.map((f) => (
            <button
              key={f.label}
              className={c(
                styles.toggle,
                enabledCustomFilters[f.label] && styles.enabled
              )}
              onClick={() =>
                setEnabledCustomFilters({
                  ...enabledCustomFilters,
                  [f.label]: !enabledCustomFilters[f.label],
                })
              }
            >
              {enabledCustomFilters[f.label] ? <FaCheck /> : <FaXmark />}
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default memo(EntityBank);
