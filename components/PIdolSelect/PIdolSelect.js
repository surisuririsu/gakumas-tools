import { useEffect, useState } from "react";
import { Idols, PIdols } from "gakumas-data";
import IconSelect from "@/components/IconSelect";
import PIdol from "@/components/PIdol";
import { PLANS } from "@/utils/plans";
import styles from "./PIdolSelect.module.scss";

export default function PIdolSelect({ selected, onChange }) {
  const [expanded, setExpanded] = useState(!selected);
  const [plan, setPlan] = useState("sense");
  const [idolId, setIdolId] = useState(1);

  useEffect(() => {
    const pIdol = PIdols.getById(selected);
    if (!pIdol) return;
    setPlan(pIdol.plan);
    setIdolId(pIdol.idolId);
  }, [selected]);

  return (
    <div className={styles.pIdolSelect}>
      <button className={styles.pIdol} onClick={() => setExpanded(!expanded)}>
        <PIdol pIdolId={selected} />
      </button>
      {expanded && (
        <div className={styles.expander}>
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
