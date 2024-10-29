import React, { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaEllipsisVertical } from "react-icons/fa6";
import Image from "@/components/Image";
import c from "@/utils/classNames";
import { SkillCards } from "@/utils/data";
import styles from "./SimulatorLogs.module.scss";

function HandState({ state }) {
  const t = useTranslations("stage");

  return (
    <div className={styles.state}>
      {Object.keys(state).map((k) => (
        <React.Fragment key={k}>
          {k == "scoreBuff" ? (
            state[k].map(({ amount, turns }) => (
              <div key={turns}>
                {t("scoreBuff")}{" "}
                <span className={styles.blue}>{amount * 100}%</span>{" "}
                {turns ? `(${t("numTurns", { num: turns })})` : ""}
              </div>
            ))
          ) : (
            <div>
              {t(k)} <span className={styles.blue}>{state[k]}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Hand({ handCardIds, scores, selectedCardId, state, idolId }) {
  const t = useTranslations("stage");

  const [expanded, setExpanded] = useState(false);
  const selectedIndex = handCardIds.indexOf(selectedCardId);

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
        {handCardIds.map(SkillCards.getById).map((skillCard, i) => (
          <div
            key={i}
            className={c(
              styles.handCard,
              i === selectedIndex && styles.selected,
              scores[i] == -Infinity && styles.unusable
            )}
          >
            <Image
              src={skillCard.getIcon(idolId)}
              width={60}
              height={60}
              alt=""
            />
            {skillCard.name}
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
