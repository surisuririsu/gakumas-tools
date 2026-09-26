import { memo, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import styles from "./PIdolCollection.module.scss";

function PIdolTile({ pIdol, index, signatureCard, collected, onToggle }) {
  const [bump, setBump] = useState(null);
  const cardIcon = signatureCard
    ? gkImg(signatureCard, pIdol.idolId).icon
    : null;
  const idol = Idols.getById(pIdol.idolId);

  return (
    <button
      type="button"
      className={c(
        styles.tile,
        collected && styles.tileCollected,
        bump == "on" && styles.bumpOn,
        bump == "off" && styles.bumpOff,
      )}
      style={{ "--i": index }}
      onClick={() => {
        setBump(collected ? "off" : "on");
        onToggle(pIdol.id);
      }}
      aria-pressed={collected}
      title={`${idol?.name || ""} ${pIdol.title}`.trim()}
    >
      <div className={styles.tileIcon}>
        {cardIcon && (
          <Image src={cardIcon} alt="" fill sizes="80px" draggable={false} />
        )}
      </div>
      <span className={styles.checkBadge} aria-hidden="true">
        <FaCheck />
      </span>
      <div className={styles.tileText}>
        <div className={styles.tileIdolName}>{idol?.name}</div>
        <div className={styles.tileTitle}>{pIdol.title}</div>
      </div>
    </button>
  );
}

export default memo(PIdolTile);
