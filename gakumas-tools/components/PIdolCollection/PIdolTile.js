import { memo } from "react";
import { FaCheck } from "react-icons/fa6";
import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./PIdolCollection.module.scss";

function PIdolTile({ pIdol, signatureCard, collected, onToggle }) {
  const cardIcon = signatureCard
    ? gkImg(signatureCard, pIdol.idolId).icon
    : null;
  const idol = Idols.getById(pIdol.idolId);

  return (
    <button
      type="button"
      className={c(styles.tile, collected && styles.tileCollected)}
      onClick={() => onToggle(pIdol.id)}
      aria-pressed={collected}
      title={`${idol?.name || ""} ${pIdol.title}`.trim()}
    >
      <div className={styles.tileIcon}>
        {cardIcon && (
          <Image src={cardIcon} alt="" fill sizes="80px" draggable={false} />
        )}
        {collected && (
          <span className={styles.checkBadge} aria-hidden="true">
            <FaCheck />
          </span>
        )}
      </div>
      <div className={styles.tileText}>
        <div className={styles.tileIdolName}>{idol?.name}</div>
        <div className={styles.tileTitle}>{pIdol.title}</div>
      </div>
    </button>
  );
}

export default memo(PIdolTile);
