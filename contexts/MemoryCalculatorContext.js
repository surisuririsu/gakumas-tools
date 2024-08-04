import { createContext, useState } from "react";

const MemoryCalculatorContext = createContext();

export function MemoryCalculatorContextProvider({ children }) {
  const [skillCardIds, _setSkillCardIds] = useState([0]);

  function setSkillCardIds(callback) {
    _setSkillCardIds((cur) => {
      return callback(cur)
        .filter((id) => id)
        .concat(0);
    });
  }

  return (
    <MemoryCalculatorContext.Provider
      value={{
        skillCardIds,
        setSkillCardIds,
      }}
    >
      {children}
    </MemoryCalculatorContext.Provider>
  );
}

export default MemoryCalculatorContext;
