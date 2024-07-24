import { useEffect, useState } from "react";
import { Idols, PIdols } from "gakumas-data";
import IconSelect from "@/components/IconSelect";
import PIdol from "@/components/PIdol";
import styles from "./PIdolSelect.module.scss";

const PLANS = ["sense", "logic"];

export default function PIdolSelect({ selected, onChange }) {
  const [expanded, setExpanded] = useState(!selected);
  const [plan, setPlan] = useState("sense");
  const [idol, setIdol] = useState(1);

  useEffect(() => {
    const pIdol = PIdols.getById(selected);
    if (!pIdol) return;
    setPlan(pIdol.plan);
    setIdol(pIdol.idolId);
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
              selected={idol}
              onChange={setIdol}
            />
          </div>
          <div className={styles.result}>
            {PIdols.getFiltered({ plans: [plan], idolIds: [idol] }).map(
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
