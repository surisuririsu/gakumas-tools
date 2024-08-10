import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./SimulatorLogs.module.scss";

export default function Hand({ handCardIds, scores, selectedCardId, idolId }) {
  const selectedIndex = handCardIds.indexOf(selectedCardId);
  return (
    <div className={styles.hand}>
      <div className={styles.handTitle}>手札</div>
      <div className={styles.handCards}>
        {handCardIds.map(SkillCards.getById).map((skillCard, i) => (
          <div
            key={i}
            className={`${styles.handCard} ${
              i == selectedIndex ? styles.selected : ""
            }`}
          >
            <Image
              src={skillCard.getDynamicIcon(idolId)}
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
