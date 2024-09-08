"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stages } from "gakumas-data";
import DataContext from "@/contexts/DataContext";
import { usePathname } from "@/i18n/routing";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { generateKafeUrl } from "@/utils/kafeSimulator";
import {
  loadoutFromSearchParams,
  loadoutToSearchParams,
} from "@/utils/simulator";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loadout = loadoutFromSearchParams(searchParams);

  const { memories } = useContext(DataContext);
  const loaded = useRef(false);
  const [memoryIds, setMemoryIds] = useState([null, null]);
  const [customStage, setCustomStage] = useState(null);

  const loadoutRef = useRef(loadout);
  const { stageId, supportBonus, params, pItemIds, skillCardIdGroups } =
    loadoutRef.current;

  useEffect(() => {
    if (loaded.current && pathname == "/simulator") {
      const params = loadoutToSearchParams(loadoutRef.current);
      window.history.pushState(null, "", `?${params.toString()}`);
    }
    loaded.current = true;
  }, [pathname]);

  const setState = (key, value) => {
    if (typeof value == "function") {
      loadoutRef.current[key] = value(loadoutRef.current[key]);
    } else {
      loadoutRef.current[key] = value;
    }
    if (pathname == "/simulator") {
      const params = loadoutToSearchParams(loadoutRef.current);
      window.history.pushState(null, "", `?${params.toString()}`);
    }
  };

  const setStageId = (value) => setState("stageId", value);
  const setSupportBonus = (value) => setState("supportBonus", value);
  const setParams = (value) => setState("params", value);
  const setPItemIds = (value) => setState("pItemIds", value);
  const setSkillCardIdGroups = (value) => setState("skillCardIdGroups", value);

  function setSkillCardIds(callback) {
    setSkillCardIdGroups((cur) => {
      const skillCardIds = [].concat(...cur);
      const updatedSkillCardIds = callback(skillCardIds);
      let chunks = [];
      for (let i = 0; i < updatedSkillCardIds.length; i += 6) {
        chunks.push(updatedSkillCardIds.slice(i, i + 6));
      }
      return chunks;
    });
  }

  function insertSkillCardIdGroup(groupIndex) {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 0, [0, 0, 0, 0, 0, 0]);
      return updatedSkillCardIds;
    });
  }

  function deleteSkillCardIdGroup(groupIndex) {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 1);
      return updatedSkillCardIds;
    });
  }

  function swapSkillCardIdGroups(groupIndexA, groupIndexB) {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      const temp = updatedSkillCardIds[groupIndexA];
      updatedSkillCardIds[groupIndexA] = updatedSkillCardIds[groupIndexB];
      updatedSkillCardIds[groupIndexB] = temp;
      return updatedSkillCardIds;
    });
  }

  function setMemory(memory, index) {
    const multiplier = index ? 0.2 : 1;

    if (!memoryIds.some((i) => i)) {
      setParams([0, 0, 0, 0]);
    }

    if (memoryIds[index]) {
      // If there is currently a memory in that slot, remove its params
      const curMemory = memories.find((mem) => mem._id == memoryIds[index]);
      if (curMemory) {
        setParams((curParams) =>
          curParams.map(
            (p, i) => (p || 0) - Math.floor(curMemory.params[i] * multiplier)
          )
        );
      }
    }

    // Set memory
    setMemoryIds((cur) => {
      const next = [...cur];
      next[index] = memory._id;
      return next;
    });
    setParams((curParams) =>
      curParams.map(
        (p, i) => (p || 0) + Math.floor(memory.params[i] * multiplier)
      )
    );
    if (index == 0) {
      setPItemIds(memory.pItemIds);
    }
    setSkillCardIdGroups((cur) => {
      const next = [...cur];
      next[index] = memory.skillCardIds;
      return next;
    });
  }

  function replacePItemId(index, itemId) {
    setPItemIds((cur) => {
      const next = [...cur];
      next[index] = itemId;
      return next;
    });
  }

  function replaceSkillCardId(index, cardId) {
    setSkillCardIds((cur) => {
      const next = [...cur];
      next[index] = cardId;
      return next;
    });
  }

  function clear() {
    setMemoryIds([null, null]);
    setParams([null, null, null, null]);
    setPItemIds([0, 0, 0]);
    setSkillCardIdGroups([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]);
  }

  let kafeUrl = null;
  let stage = FALLBACK_STAGE;
  if (stageId == "custom") {
    stage = customStage;
  } else if (stageId) {
    stage = Stages.getById(stageId);
    kafeUrl = generateKafeUrl(
      stage,
      supportBonus,
      params,
      pItemIds,
      skillCardIdGroups
    );
  }

  return (
    <LoadoutContext.Provider
      value={{
        setMemory,
        stageId,
        setStageId,
        customStage,
        setCustomStage,
        stage,
        supportBonus,
        setSupportBonus,
        params,
        setParams,
        pItemIds,
        skillCardIdGroups,
        replacePItemId,
        replaceSkillCardId,
        insertSkillCardIdGroup,
        deleteSkillCardIdGroup,
        swapSkillCardIdGroups,
        clear,
        kafeUrl,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
