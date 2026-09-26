import React, { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { SkillCards } from "gakumas-data";
import Collapse from "@/components/Collapse";
import EntityIcon from "@/components/EntityIcon";
import c from "@/utils/classNames";
import { EntityTypes } from "@/utils/entities";
import HandState from "./HandState";
import HandTitle from "./HandTitle";
import styles from "./SimulatorLogs.module.scss";

function Hand({ handCards, scores, selectedIndex, state, idolId, hideScores }) {
  const t = useTranslations("stage");

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.hand}>
      <HandTitle
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      <Collapse open={expanded}>
        <HandState state={state} />
      </Collapse>
      <div className={styles.handCards}>
        {handCards.map((card, i) => (
          <div
            key={i}
            className={c(
              styles.handCard,
              i === selectedIndex && styles.selected,
              scores[i] == -Infinity && styles.unusable
            )}
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
            <span className={styles.cardName}>
              {SkillCards.getById(card.id).name}
            </span>
            {!hideScores && (
              <span className={styles.cardScore}>
                {scores[i] == -Infinity ? t("unplayable") : scores[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Hand);
