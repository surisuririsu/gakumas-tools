"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stages } from "gakumas-data";
import DataContext from "@/contexts/DataContext";
import { getLoadoutFromSearchParams, getSimulatorUrl } from "@/utils/simulator";
import { generateKafeUrl } from "@/utils/kafeSimulator";
import { FALLBACK_STAGE } from "@/simulator/constants";

const LOADOUT_STORAGE_KEY = "gakumas-tools.loadout";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const searchParams = useSearchParams();
  const initial = getLoadoutFromSearchParams(searchParams);

  const { memories } = useContext(DataContext);
  const [loaded, setLoaded] = useState(false);
  const [memoryIds, setMemoryIds] = useState([null, null]);
  const [stageId, setStageId] = useState(initial.stageId);
  const [customStage, setCustomStage] = useState(null);
  const [supportBonus, setSupportBonus] = useState(initial.supportBonus);
  const [params, setParams] = useState(initial.params);
  const [pItemIds, setPItemIds] = useState(initial.pItemIds);
  const [skillCardIdGroups, setSkillCardIdGroups] = useState(
    initial.skillCardIdGroups
  );

  useEffect(() => {
    if (initial.hasDataFromParams) {
      setLoaded(true);
      return;
    }
    const loadoutString = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (loadoutString) {
      const data = JSON.parse(loadoutString);
      if (data.memoryIds?.some((id) => id)) setMemoryIds(data.memoryIds);
      if (data.stageId) setStageId(data.stageId);
      if (data.customStage) setCustomStage(data.customStage);
      if (data.supportBonus) setSupportBonus(data.supportBonus);
      if (data.params?.some((id) => id)) setParams(data.params);
      if (data.pItemIds?.some((id) => id)) setPItemIds(data.pItemIds);
      if (data.skillCardIdGroups?.some((g) => g?.some((id) => id)))
        setSkillCardIdGroups(data.skillCardIdGroups);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      LOADOUT_STORAGE_KEY,
      JSON.stringify({
        memoryIds,
        stageId,
        customStage,
        supportBonus,
        params,
        pItemIds,
        skillCardIdGroups,
      })
    );
  }, [
    memoryIds,
    stageId,
    customStage,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
  ]);

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

  const insertSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 0, [0, 0, 0, 0, 0, 0]);
      return updatedSkillCardIds;
    });
  };

  const deleteSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 1);
      return updatedSkillCardIds;
    });
  };

  const swapSkillCardIdGroups = (groupIndexA, groupIndexB) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      const temp = updatedSkillCardIds[groupIndexA];
      updatedSkillCardIds[groupIndexA] = updatedSkillCardIds[groupIndexB];
      updatedSkillCardIds[groupIndexB] = temp;
      return updatedSkillCardIds;
    });
  };

  function setMemory(memory, index) {
    const multiplier = index ? 0.2 : 1;

    // If there is currently a memory in that slot, remove its params
    if (memoryIds[index]) {
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

  const simulatorUrl = getSimulatorUrl(
    stageId,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups
  );
  const kafeUrl = generateKafeUrl(pItemIds, skillCardIdGroups, stageId, params);

  let stage = FALLBACK_STAGE;
  if (stageId == "custom") {
    stage = customStage;
  } else if (stageId) {
    stage = Stages.getById(stageId);
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
        simulatorUrl,
        kafeUrl,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
