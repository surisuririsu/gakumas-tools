import { memo, useContext, useEffect, useMemo, useState } from "react";
import { PIdols } from "gakumas-data";
import PlanIdolSelects from "@/components/PlanIdolSelects";
import PIdol from "@/components/PIdol";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./PIdolSelect.module.scss";

function PIdolSelect({ selected, onChange }) {
  const { plan, setPlan, idolId, setIdolId } = useContext(WorkspaceContext);
  const [expanded, setExpanded] = useState(!selected);

  useEffect(() => {
    if (!selected || !expanded) return;
    const pIdol = PIdols.getById(selected);
    setPlan(pIdol.plan);
    setIdolId(pIdol.idolId);
  }, [expanded, selected]);

  const pIdols = useMemo(
    () => PIdols.getFiltered({ plans: [plan], idolIds: [idolId] }),
    [plan, idolId]
  );

  return (
    <div className={styles.pIdolSelect}>
      <button className={styles.pIdol} onClick={() => setExpanded(!expanded)}>
        <PIdol pIdolId={selected} />
      </button>

      {expanded && (
        <div className={styles.expander}>
          <PlanIdolSelects
            plan={plan}
            idolId={idolId}
            setPlan={setPlan}
            setIdolId={setIdolId}
          />

          <div className={styles.result}>
            {pIdols.map((pIdol) => (
              <button
                key={pIdol.id}
                className={styles.pIdolButton}
                onClick={() => {
                  onChange(pIdol.id);
                  setExpanded(false);
                }}
              >
                <PIdol pIdolId={pIdol.id} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PIdolSelect);
