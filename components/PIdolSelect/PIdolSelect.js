import { useState } from "react";
import { Idols, PIdols } from "gakumas-data";
import IconSelect from "@/components/IconSelect";
import styles from "./PIdolSelect.module.scss";

const PLANS = ["sense", "logic"];

export default function PIdolSelect({ selected, onChange }) {
  const [expanded, setExpanded] = useState(!selected);
  const [plan, setPlan] = useState("sense");
  const [idol, setIdol] = useState(1);

  return (
    <div className={styles.pIdolSelect}>
      <div className={styles.pIdol} onClick={() => setExpanded(!expanded)}>
        {selected}
      </div>
      {expanded && (
        <div>
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
          <div>
            {PIdols.getFiltered({ plans: [plan], idolIds: [idol] }).map(
              (pIdol) => (
                <a
                  key={pIdol.id}
                  className={styles.option}
                  onClick={() => {
                    onChange(pIdol.id);
                    setExpanded(false);
                  }}
                >
                  {pIdol.rarity} {pIdol.title}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
