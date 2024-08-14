import { memo } from "react";
import { Idols } from "gakumas-data";
import IconSelect from "@/components/IconSelect";
import { PLANS } from "@/utils/plans";
import styles from "./PlanIdolSelects.module.scss";

const plans = PLANS.map((alias) => ({
  id: alias,
  iconSrc: `/plans/${alias}.png`,
  alt: alias,
}));

const idols = Idols.getAll().map(({ id, name, icon }) => ({
  id,
  iconSrc: icon,
  alt: name,
}));

function PlanIdolSelects({ plan, idolId, setPlan, setIdolId }) {
  return (
    <div className={styles.selects}>
      <IconSelect options={plans} selected={plan} onChange={setPlan} />
      <IconSelect options={idols} selected={idolId} onChange={setIdolId} />
    </div>
  );
}

export default memo(PlanIdolSelects);