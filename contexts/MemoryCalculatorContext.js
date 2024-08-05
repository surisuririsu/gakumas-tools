import { createContext, useState } from "react";
import { SkillCards } from "gakumas-data";

const MemoryCalculatorContext = createContext();

export function MemoryCalculatorContextProvider({ children }) {
  const [targetSkillCardIds, _setTargetSkillCardIds] = useState([0]);
  const [alternateSkillCardIds, _setAlternateSkillCardIds] = useState([]);
  const [acquiredSkillCardIds, _setAcquiredSkillCardIds] = useState([0]);

  function setAcquiredSkillCardIds(callback) {
    _setAcquiredSkillCardIds((cur) => {
      return callback(cur)
        .filter((id) => id)
        .concat(0);
    });
  }

  function setTargetSkillCardIds(callback) {
    let removedIndices = [];
    _setTargetSkillCardIds((cur) => {
      const updated = callback(cur);
      return updated
        .filter((id, idx) => {
          if (!id) removedIndices.push(idx);
          return id;
        })
        .concat(0)
        .slice(0, 5);
    });
    // If target skill card is removed, also remove the associated alternates
    _setAlternateSkillCardIds((curAlts) => {
      const updatedCurAlts = JSON.parse(JSON.stringify(curAlts));
      removedIndices.forEach((idx) => (updatedCurAlts[idx] = 0));
      return updatedCurAlts.filter((alts) => alts !== 0);
    });
  }

  function setAlternateSkillCardIds(callback) {
    _setAlternateSkillCardIds((cur) => {
      const arr = cur.reduce(
        (acc, target) => acc.concat(Array.from({ ...target, length: 10 })),
        []
      );

      const updatedArr = callback(arr);

      let updatedObj = [];
      for (let i = 0; i < cur.length; i++) {
        const chunk = updatedArr.slice(i * 10, i * 10 + 10);
        if (chunk.some((id) => id != null)) {
          updatedObj[i] = updatedArr
            .slice(i * 10, i * 10 + 10)
            .filter((id) => id);
        } else {
          updatedObj[i] = null;
        }
      }
      return updatedObj;
    });
  }

  function addAlternateSkillCards(index) {
    const updatedAlternateSkillCardIds = JSON.parse(
      JSON.stringify(alternateSkillCardIds)
    );
    if (alternateSkillCardIds[index]?.length) {
      updatedAlternateSkillCardIds[index].push(0);
    } else {
      // Add the opposite upgraded version of the card by default
      let targetSkillCard = SkillCards.getById(targetSkillCardIds[index]);
      if (!targetSkillCard || targetSkillCard.rarity == "T") {
        updatedAlternateSkillCardIds[index] = [0];
      } else if (targetSkillCard.upgraded) {
        updatedAlternateSkillCardIds[index] = [targetSkillCard.id - 1];
      } else {
        updatedAlternateSkillCardIds[index] = [targetSkillCard.id + 1];
      }
    }
    _setAlternateSkillCardIds(updatedAlternateSkillCardIds);
  }

  return (
    <MemoryCalculatorContext.Provider
      value={{
        targetSkillCardIds,
        setTargetSkillCardIds,
        alternateSkillCardIds,
        setAlternateSkillCardIds,
        addAlternateSkillCards,
        acquiredSkillCardIds,
        setAcquiredSkillCardIds,
      }}
    >
      {children}
    </MemoryCalculatorContext.Provider>
  );
}

export default MemoryCalculatorContext;
