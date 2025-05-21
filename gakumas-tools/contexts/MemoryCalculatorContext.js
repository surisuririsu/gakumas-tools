"use client";
import { createContext, useState } from "react";
import { SkillCards } from "gakumas-data";

const MemoryCalculatorContext = createContext();

export function MemoryCalculatorContextProvider({ children }) {
  const [targetSkillCardIds, _setTargetSkillCardIds] = useState([0]);
  const [alternateSkillCardIds, _setAlternateSkillCardIds] = useState([]);
  const [targetNegations, _setTargetNegations] = useState([]);
  const [acquiredSkillCardIds, _setAcquiredSkillCardIds] = useState([0]);
  const [rank, setRank] = useState("SS");

  function setTargetSkillCardIds(callback) {
    let removedIndices = [];
    _setTargetSkillCardIds((cur) => {
      const updated = callback(cur);
      return updated
        .filter((id, idx) => {
          if (!id) removedIndices.push(idx);
          return id;
        })
        .concat(0);
    });

    // If target skill card is removed, also remove the associated alternates and negations
    _setAlternateSkillCardIds((cur) => {
      const updated = JSON.parse(JSON.stringify(cur));
      removedIndices.forEach((idx) => (updated[idx] = 0));
      return updated.filter((alts) => alts !== 0);
    });

    _setTargetNegations((cur) => {
      const updated = [...cur];
      removedIndices.forEach((idx) => (updated[idx] = 0));
      return updated.filter((neg) => neg !== 0);
    });
  }

  function setAlternateSkillCardIds(callback) {
    _setAlternateSkillCardIds((cur) => {
      let arr = [];
      for (let i = 0; i < cur.length; i++) {
        arr = arr.concat(Array.from({ ...cur[i], length: 10 }));
      }

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

  function setNegation(index, value) {
    const updatedNegations = [...targetNegations];
    updatedNegations[index] = value;
    _setTargetNegations(updatedNegations);
  }

  function setAcquiredSkillCardIds(callback) {
    _setAcquiredSkillCardIds((cur) => {
      return callback(cur)
        .filter((id) => id)
        .concat(0);
    });
  }

  function replaceTargetCardId(index, cardId) {
    setTargetSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }

  function replaceAlternateCardId(index, cardId) {
    setAlternateSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }

  function replaceAcquiredCardId(index, cardId) {
    setAcquiredSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }

  function clearTargetCardIds() {
    _setTargetSkillCardIds([0]);
    _setAlternateSkillCardIds([]);
  }

  return (
    <MemoryCalculatorContext.Provider
      value={{
        targetSkillCardIds,
        alternateSkillCardIds,
        acquiredSkillCardIds,
        targetNegations,
        addAlternateSkillCards,
        setNegation,
        replaceTargetCardId,
        replaceAlternateCardId,
        replaceAcquiredCardId,
        clearTargetCardIds,
        rank,
        setRank,
      }}
    >
      {children}
    </MemoryCalculatorContext.Provider>
  );
}

export default MemoryCalculatorContext;
