import React, { useContext } from "react";
import { FaCirclePlus, FaCircleMinus } from "react-icons/fa6";
import EntityIcon from "@/components/EntityIcon";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import { EntityTypes } from "@/utils/entities";
import styles from "./TargetSkillCards.module.scss";

export default function TargetSkillCards() {
  const {
    targetSkillCardIds,
    alternateSkillCardIds,
    addAlternateSkillCards,
    targetNegations,
    setNegation,
  } = useContext(MemoryCalculatorContext);

  return (
    <div className={styles.targetSkillCards}>
      {targetSkillCardIds.map((skillCardId, index) => (
        <div key={`${index}_${skillCardId}`} className={styles.slot}>
          <button
            className={styles.minus}
            onClick={() => setNegation(index, !targetNegations[index])}
          >
            {targetNegations[index] ? (
              <span className={styles.not}>NOT</span>
            ) : (
              <FaCircleMinus />
            )}
          </button>
          <div
            key={`${index}_${skillCardId}`}
            className={`${styles.orGroup} ${
              alternateSkillCardIds[index]?.length ? styles.hasMultiple : ""
            }`}
          >
            <EntityIcon
              type={EntityTypes.SKILL_CARD}
              id={skillCardId}
              region="memoryCalculator:target"
              index={index}
            />

            {alternateSkillCardIds[index]?.map((altSkillCardId, altIndex) => (
              <React.Fragment
                key={`${index}_${altIndex}_${skillCardId}_${altSkillCardId}`}
              >
                <span className={styles.or}>OR</span>
                <EntityIcon
                  type={EntityTypes.SKILL_CARD}
                  id={altSkillCardId}
                  region="memoryCalculator:alternate"
                  index={index * 10 + altIndex}
                />
              </React.Fragment>
            ))}

            {alternateSkillCardIds[index]?.length != 10 &&
              alternateSkillCardIds[index]?.[
                alternateSkillCardIds[index].length - 1
              ] != 0 && (
                <button
                  className={styles.plus}
                  onClick={() => addAlternateSkillCards(index)}
                >
                  <FaCirclePlus />
                </button>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
