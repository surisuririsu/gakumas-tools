import React, { memo, useState } from "react";
import Image from "next/image";
import { FaEllipsisVertical } from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import { STRINGS } from "@/simulator/constants";
import c from "@/utils/classNames";
import styles from "./SimulatorLogs.module.scss";

function HandState({ state }) {
  return (
    <div className={styles.state}>
      {Object.keys(state).map((k) => (
        <React.Fragment key={k}>
          {k == "scoreBuff" ? (
            state[k].map(({ amount, turns }) => (
              <div key={turns}>
                スコア上昇量増加{" "}
                <span className={styles.blue}>{amount * 100}%</span>{" "}
                {turns ? `(${turns}ターン)` : ""}
              </div>
            ))
          ) : (
            <div>
              {STRINGS[k]} <span className={styles.blue}>{state[k]}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Hand({ handCardIds, scores, selectedCardId, state, idolId }) {
  const [expanded, setExpanded] = useState(false);
  const selectedIndex = handCardIds.indexOf(selectedCardId);

  return (
    <div className={styles.hand}>
      <div className={styles.handTitle}>
        手札{" "}
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
              i === selectedIndex && styles.selected
            )}
          >
            <Image
              src={skillCard.getIcon(idolId)}
              width={60}
              height={60}
              alt=""
            />
            {skillCard.name}
            <span className={styles.cardScore}>{scores[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(Hand);
