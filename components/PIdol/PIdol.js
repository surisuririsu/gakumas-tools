import { memo } from "react";
import Image from "next/image";
import { PIdols } from "gakumas-data";
import styles from "./PIdol.module.scss";

function PIdol({ pIdolId }) {
  const pIdol = PIdols.getById(pIdolId);
  const icon = pIdol?.getIcon();

  return (
    <div className={styles.pIdol}>
      {icon && <Image src={icon} sizes="81px" fill alt="" />}
      {pIdol && (
        <div className={styles.overlay}>
          <div className={styles.attributes}>
            <Image
              src={`/rarities/${pIdol.rarity}.png`}
              height={20}
              width={60}
              alt={pIdol.rarity}
            />
            <Image
              src={`/plans/${pIdol.plan}.png`}
              width={20}
              height={20}
              alt={pIdol.plan}
            />
          </div>
          {pIdol.title}
        </div>
      )}
    </div>
  );
}

export default memo(PIdol);
