import Image from "next/image";
import { PIdols } from "gakumas-data";
import styles from "./PIdol.module.scss";

export default function PIdol({ pIdolId }) {
  const pIdol = PIdols.getById(pIdolId);
  return (
    <div className={styles.pIdol}>
      {pIdol?.icon && <Image src={pIdol.icon} sizes="81px" fill />}
      {pIdol && (
        <div className={styles.overlay}>
          <div className={styles.attributes}>
            <Image
              src={`/rarities/${pIdol.rarity}.png`}
              height={20}
              width={60}
            />
            <Image src={`/plans/${pIdol.plan}.png`} width={20} height={20} />
          </div>
          {pIdol.title}
        </div>
      )}
    </div>
  );
}
