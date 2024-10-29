import { memo, useMemo } from "react";
import { PIdols } from "gakumas-data/lite";
import Image from "@/components/Image";
import PIdol from "@/components/PIdol";
import { calculateContestPower } from "@/utils/contestPower";
import { PItems, SkillCards } from "@/utils/data";
import MemorySummaryActionButtons from "./MemorySummaryActionButtons";
import styles from "./MemorySummary.module.scss";

function MemorySummary({ memory, picking, onClick }) {
  const { name, pIdolId, params, pItemIds, skillCardIds } = memory;
  const idolId = PIdols.getById(pIdolId)?.idolId;
  const contestPower = calculateContestPower(params, pItemIds, skillCardIds);

  const pItems = useMemo(
    () => pItemIds.filter((p) => p).map(PItems.getById),
    [pItemIds]
  );
  const skillCards = useMemo(
    () => skillCardIds.filter((s) => s).map(SkillCards.getById),
    [skillCardIds]
  );

  const summaryContent = (
    <>
      <div className={styles.left}>
        <PIdol pIdolId={pIdolId} />
        {!picking && <MemorySummaryActionButtons memory={memory} />}
      </div>

      <div className={styles.details}>
        <span className={styles.text}>
          <span>{name}</span>
          <span>{contestPower}</span>
        </span>

        <div className={styles.row}>
          {pItems.map((pItem, i) => (
            <Image
              key={i}
              src={pItem.getIcon()}
              width={35}
              height={35}
              alt={pItem.name}
              draggable={false}
            />
          ))}
          <div className={styles.filler} />
          <div className={styles.parameters}>
            <div style={{ flex: params[0] }} />
            <div style={{ flex: params[1] }} />
            <div style={{ flex: params[2] }} />
          </div>
        </div>

        <div className={styles.row}>
          {skillCards.map((skillCard, i) => (
            <div key={i} className={styles.imageWrapper}>
              <Image
                src={skillCard.getIcon(idolId)}
                fill
                sizes="50px"
                alt={skillCard.name}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  if (picking) {
    return (
      <button className={styles.memorySummary} onClick={onClick}>
        {summaryContent}
      </button>
    );
  } else {
    return <div className={styles.memorySummary}>{summaryContent}</div>;
  }
}

export default memo(MemorySummary);
