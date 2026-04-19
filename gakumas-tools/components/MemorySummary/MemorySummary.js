import { memo, useMemo } from "react";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import EntityIcon from "@/components/EntityIcon";
import Image from "@/components/Image";
import PIdol from "@/components/PIdol";
import { calculateContestPower } from "@/utils/contestPower";
import { EntityTypes } from "@/utils/entities";
import MemorySummaryActionButtons from "./MemorySummaryActionButtons";
import styles from "./MemorySummary.module.scss";

function MemorySummary({ memory, picking, onClick }) {
  const { name, pIdolId, params, pItemIds, skillCardIds, customizations } =
    memory;
  const idolId = PIdols.getById(pIdolId)?.idolId;
  const contestPower = calculateContestPower(
    params,
    pItemIds,
    skillCardIds,
    customizations
  );

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
              src={gkImg(pItem).icon}
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
            <div key={i} className={styles.imgWrapper}>
              <EntityIcon
                type={EntityTypes.SKILL_CARD}
                id={skillCard.id}
                customizations={customizations?.[i]}
                idolId={idolId}
                size="fill"
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
