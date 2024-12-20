import React, { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaEllipsisVertical } from "react-icons/fa6";
import EntityIcon from "@/components/EntityIcon";
import { ALL_FIELDS, S } from "@/simulator/constants";
import c from "@/utils/classNames";
import { SkillCards } from "@/utils/data";
import { EntityTypes } from "@/utils/entities";
import styles from "./SimulatorLogs.module.scss";

function HandState({ state }) {
  const t = useTranslations("stage");

  return (
    <div className={styles.state}>
      {Object.keys(state).map((k) => (
        <React.Fragment key={k}>
          {k == S.scoreBuffs ? (
            state[k].map(({ amount, turns }) => (
              <div key={turns}>
                {t("scoreBuff")}{" "}
                <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
                {turns ? `(${t("numTurns", { num: turns })})` : ""}
              </div>
            ))
          ) : (
            <div>
              {t(ALL_FIELDS[k])}{" "}
              <span className={styles.blue}>
                {isNaN(state[k]) ? t(state[k]) : state[k]}
              </span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Hand({ handCards, scores, selectedIndex, state, idolId }) {
  const t = useTranslations("stage");

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.hand}>
      <div className={styles.handTitle}>
        {t("hand")}{" "}
        <button onClick={() => setExpanded(!expanded)}>
          <FaEllipsisVertical />
        </button>
      </div>
      {expanded && <HandState state={state} />}
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
                numCustomizations={card.c}
                size="fill"
              />
            </div>
            {SkillCards.getById(card.id).name}
            <span className={styles.cardScore}>
              {scores[i] == -Infinity ? t("unplayable") : scores[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Hand);
