import { createContext, useState } from "react";

const MemoryCalculatorContext = createContext();

export function MemoryCalculatorContextProvider({ children }) {
  const [targetSkillCardIds, _setTargetSkillCardIds] = useState([0]);
  const [acquiredSkillCardIds, _setAcquiredSkillCardIds] = useState([0]);

  function setAcquiredSkillCardIds(callback) {
    _setAcquiredSkillCardIds((cur) => {
      return callback(cur)
        .filter((id) => id)
        .concat(0);
    });
  }

  function setTargetSkillCardIds(callback) {
    _setTargetSkillCardIds((cur) => {
      return callback(cur)
        .filter((id) => id)
        .concat(0);
    });
  }

  return (
    <MemoryCalculatorContext.Provider
      value={{
        targetSkillCardIds,
        setTargetSkillCardIds,
        acquiredSkillCardIds,
        setAcquiredSkillCardIds,
      }}
    >
      {children}
    </MemoryCalculatorContext.Provider>
  );
}

export default MemoryCalculatorContext;
