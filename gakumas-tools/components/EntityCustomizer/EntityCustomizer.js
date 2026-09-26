import { memo, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { Customizations, SkillCards } from "gakumas-data";
import EntityIcon from "@/components/EntityIcon";
import { usePopOnChange } from "@/utils/usePop";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import c from "@/utils/classNames";
import styles from "./EntityCustomizer.module.scss";

function C11nStepper({ c11n, level, onDecrement, onIncrement }) {
  const pop = usePopOnChange(level);

  return (
    <div className={c(styles.c11n, styles[c11n.type])}>
      <div className={styles.input}>
        <button
          type="button"
          className={styles.step}
          disabled={level <= 0}
          aria-label="-"
          onClick={onDecrement}
        >
          <FaMinus />
        </button>
        <div key={level} className={c(styles.level, pop && styles.levelPop)}>
          {level}
        </div>
        <button
          type="button"
          className={styles.step}
          disabled={level >= c11n.max}
          aria-label="+"
          onClick={onIncrement}
        >
          <FaPlus />
        </button>
      </div>
      <span className={styles.text} title={c11n.name}>
        {c11n.name}
      </span>
    </div>
  );
}

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
      <div className={styles.body}>
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
            <C11nStepper
              key={c11n.id}
              c11n={c11n}
              level={current[c11n.id] || 0}
              onDecrement={() => decrement(c11n.id)}
              onIncrement={() => increment(c11n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(EntityCustomizer);
