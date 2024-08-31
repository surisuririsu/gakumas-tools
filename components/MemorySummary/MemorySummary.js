import { memo, useMemo } from "react";
import Image from "next/image";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import PIdol from "@/components/PIdol";
import { calculateContestPower } from "@/utils/contestPower";
import MemorySummaryActionButtons from "./MemorySummaryActionButtons";
import styles from "./MemorySummary.module.scss";

function MemorySummary({ memory, action, onClick }) {
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
        {action != "pick" && <MemorySummaryActionButtons memory={memory} />}
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

  if (action == "pick") {
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
