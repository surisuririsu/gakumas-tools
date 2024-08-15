import { useContext, useState } from "react";
import { PIdols } from "gakumas-data";
import PlanIdolSelects from "@/components/PlanIdolSelects";
import PIdol from "@/components/PIdol";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./PIdolSelect.module.scss";

export default function PIdolSelect({ selected, onChange }) {
  const { plan, setPlan, idolId, setIdolId } = useContext(WorkspaceContext);
  const [expanded, setExpanded] = useState(!selected);

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
            {PIdols.getFiltered({ plans: [plan], idolIds: [idolId] }).map(
              (pIdol) => (
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
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
