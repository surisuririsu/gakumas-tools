import { memo } from "react";
import IconSelect from "@/components/IconSelect";
import { Idols } from "@/utils/data";
import { PLANS } from "@/utils/plans";
import styles from "./PlanIdolSelects.module.scss";

const plans = PLANS.map((alias) => ({
  id: alias,
  iconSrc: `/plans/${alias}.png`,
  alt: alias,
}));

const idols = Idols.getAll().map(({ id, name, getIcon }) => ({
  id,
  iconSrc: getIcon(),
  alt: name,
}));

function PlanIdolSelects({ plan, idolId, setPlan, setIdolId, includeAll }) {
  return (
    <div className={styles.selects}>
      <IconSelect
        options={plans}
        selected={plan}
        onChange={setPlan}
        includeAll={includeAll}
        collapsable
      />
      <IconSelect
        options={idols}
        selected={idolId}
        onChange={setIdolId}
        includeAll={includeAll}
        collapsable
      />
    </div>
  );
}

export default memo(PlanIdolSelects);
