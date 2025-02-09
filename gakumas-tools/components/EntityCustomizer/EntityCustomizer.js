import { memo, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Customizations, SkillCards } from "gakumas-data";
import EntityIcon from "@/components/EntityIcon";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import c from "@/utils/classNames";
import styles from "./EntityCustomizer.module.scss";

function EntityCustomizer({ type, id, customizations = {}, onCustomize }) {
  const t = useTranslations("EntityCustomizer");
  const { idolId } = useContext(WorkspaceContext);
  const [current, setCurrent] = useState(customizations);

  const availableC11ns = useMemo(() => {
    const c11nIds = SkillCards.getById(id).availableCustomizations || [];
    return c11nIds.map(Customizations.getById).filter((x) => x);
  }, [id]);

  const decrement = (id) => {
    const updated = {
      ...current,
      [id]: (current[id] || 1) - 1,
    };
    setCurrent(updated);
    onCustomize(updated);
  };

  const increment = (id) => {
    const updated = {
      ...current,
      [id]: (current[id] || 0) + 1,
    };
    setCurrent(updated);
    onCustomize(updated);
  };

  return (
    <div className={styles.entityCustomizer}>
      <div className={styles.label}>{t("customization")}</div>
      <div className={styles.icon}>
        <EntityIcon
          type={type}
          id={id}
          idolId={idolId}
          customizations={current}
          size="fill"
        />
      </div>
      <div className={styles.c11ns}>
        {availableC11ns.map((c11n) => (
          <div key={c11n.id} className={c(styles.c11n, styles[c11n.type])}>
            <div className={styles.input}>
              <button
                className={c((current[c11n.id] || 0) <= 0 && styles.disabled)}
                disabled={(current[c11n.id] || 0) <= 0}
                onClick={() => decrement(c11n.id)}
              >
                -
              </button>
              <div className={styles.level}>{current[c11n.id] || 0}</div>
              <button
                className={c(current[c11n.id] >= c11n.max && styles.disabled)}
                disabled={current[c11n.id] >= c11n.max}
                onClick={() => increment(c11n.id)}
              >
                +
              </button>
            </div>
            <span className={styles.text} title={c11n.name}>
              {c11n.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(EntityCustomizer);
