import React, { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaEllipsisVertical } from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import Button from "@/components/Button";
import EntityIcon from "@/components/EntityIcon";
import c from "@/utils/classNames";
import { EntityTypes } from "@/utils/entities";
import HandState from "./HandState";
import styles from "./SimulatorLogs.module.scss";

function InteractiveHand({
  handCards,
  scores,
  selectedIndex,
  state,
  idolId,
  pendingDecision,
  onDecision,
}) {
  const t = useTranslations("stage");

  const [expanded, setExpanded] = useState(true);

  const handRef = React.useRef(null);
  React.useEffect(() => {
    if (handRef.current) {
      handRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const getCardIndex = (i) => {
    return pendingDecision.handCards[i];
  };

  const isCardUsable = (i) => {
    const cardIndex = getCardIndex(i);
    return pendingDecision.usableCards.includes(cardIndex);
  };

  const handleCardClick = (i) => {
    const cardIndex = getCardIndex(i);
    if (isCardUsable(i)) {
      onDecision(cardIndex);
    }
  };

  const handleEndTurn = () => {
    onDecision(null);
  };

  return (
    <div ref={handRef} className={styles.hand}>
      <div className={styles.handTitle}>
        {t("hand")}{" "}
        <button onClick={() => setExpanded(!expanded)}>
          <FaEllipsisVertical />
        </button>
      </div>
      {expanded && <HandState state={state} />}
      <div className={styles.handCards}>
        {handCards.map((card, i) => (
          <button
            key={i}
            type="button"
            className={c(
              styles.handCard,
              i === selectedIndex && styles.selected,
              scores[i] == -Infinity && styles.unusable,
              styles.interactive,
              !isCardUsable(i) && styles.unusable
            )}
            onClick={() => handleCardClick(i)}
            disabled={!isCardUsable(i)}
          >
            <div className={styles.imgWrapper}>
              <EntityIcon
                type={EntityTypes.SKILL_CARD}
                id={card.id}
                customizations={card.c}
                idolId={idolId}
                size="fill"
              />
            </div>
            {SkillCards.getById(card.id).name}
          </button>
        ))}
      </div>
      <div className={styles.skip}>
        <Button fill className={styles.skipButton} onClick={handleEndTurn}>
          {t("skip")}
        </Button>
      </div>
    </div>
  );
}

export default memo(InteractiveHand);
