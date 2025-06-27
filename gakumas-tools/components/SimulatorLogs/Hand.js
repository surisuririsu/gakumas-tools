import React, { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaEllipsisVertical } from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import { ALL_FIELDS, S } from "gakumas-engine";
import EntityIcon from "@/components/EntityIcon";
import c from "@/utils/classNames";
import { EntityTypes } from "@/utils/entities";
import styles from "./SimulatorLogs.module.scss";

function HandStateLine({ k, state }) {
  const t = useTranslations("stage");

  let content = null;
  if (k == S.scoreBuffs) {
    content = state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t("scoreBuff")}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  } else if (k == S.scoreDebuffs) {
    content = state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t("scoreDebuff")}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  } else if (k == S.goodImpressionTurnsBuffs) {
    content = state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t("goodImpressionTurnsBuff")}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  } else if (k == S.goodImpressionTurnsEffectBuffs) {
    content = state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t("goodImpressionTurnsEffectBuff")}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  } else if (k == S.concentrationBuffs) {
    content = state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t("concentrationBuff")}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  } else {
    content = (
      <div>
        {t(ALL_FIELDS[k])}{" "}
        <span className={styles.blue}>
          {isNaN(state[k]) ? t(state[k]) : state[k]}
        </span>
      </div>
    );
  }

  return content;
}

function HandState({ state }) {
  const t = useTranslations("stage");

  return (
    <div className={styles.state}>
      {Object.keys(state).map((k) => (
        <HandStateLine key={k} k={k} state={state} />
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
                customizations={card.c}
                idolId={idolId}
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
