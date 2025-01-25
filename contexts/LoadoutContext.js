"use client";
import { createContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stages } from "@/utils/stages";
import { loadoutFromSearchParams, getSimulatorUrl } from "@/utils/simulator";
import { generateKafeUrl } from "@/utils/kafeSimulator";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { fixCustomizations } from "@/utils/customizations";

const LOADOUT_HISTORY_STORAGE_KEY = "gakumas-tools.loadout-history";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const searchParams = useSearchParams();
  const initial = loadoutFromSearchParams(searchParams);

  const [loaded, setLoaded] = useState(false);
  const [memoryParams, setMemoryParams] = useState([null, null]);
  const [stageId, setStageId] = useState(initial.stageId);
  const [customStage, setCustomStage] = useState(null);
  const [supportBonus, setSupportBonus] = useState(initial.supportBonus);
  const [params, setParams] = useState(initial.params);
  const [pItemIds, setPItemIds] = useState(initial.pItemIds);
  const [skillCardIdGroups, setSkillCardIdGroups] = useState(
    initial.skillCardIdGroups
  );
  const [customizationGroups, setCustomizationGroups] = useState(
    initial.customizationGroups
  );
  const [loadoutHistory, setLoadoutHistory] = useState([]);

  const setLoadout = (loadout) => {
    setStageId(loadout.stageId);
    if (loadout.stageId == "custom") {
      let custom = loadout.customStage;
      if (Array.isArray(custom.firstTurns)) {
        const length = custom.firstTurns.length;
        custom.firstTurns = custom.firstTurns.reduce((acc, cur) => {
          acc[cur] = 1 / length;
          return acc;
        }, {});
      }
      setCustomStage(custom);
    }
    setSupportBonus(loadout.supportBonus);
    setParams(loadout.params);
    setPItemIds(loadout.pItemIds);
    setSkillCardIdGroups(loadout.skillCardIdGroups);
    if (loadout.customizationGroups) {
      try {
        setCustomizationGroups(
          loadout.customizationGroups.map((g) => g.map(fixCustomizations))
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Load history and latest loadout from local storage on mount
  useEffect(() => {
    const loadoutHistoryString = localStorage.getItem(
      LOADOUT_HISTORY_STORAGE_KEY
    );
    if (loadoutHistoryString) {
      const data = JSON.parse(loadoutHistoryString);
      setLoadoutHistory(data);
      if (!initial.hasDataFromParams) setLoadout(data[0]);
    }
    setLoaded(true);
  }, []);

  // Update local storage when history changed
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      LOADOUT_HISTORY_STORAGE_KEY,
      JSON.stringify(loadoutHistory)
    );
  }, [loadoutHistory]);

  function clear() {
    setMemoryParams([null, null]);
    setParams([null, null, null, null]);
    setPItemIds([0, 0, 0]);
    setSkillCardIdGroups([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]);
    setCustomizationGroups([[], []]);
  }

  function replacePItemId(index, itemId) {
    setPItemIds((cur) => {
      const next = [...cur];
      next[index] = itemId;
      return next;
    });
  }

  function replaceSkillCardId(index, cardId) {
    let changed = false;
    setSkillCardIdGroups((cur) => {
      const skillCardIds = [].concat(...cur);
      const updatedSkillCardIds = [...skillCardIds];
      if (cardId != updatedSkillCardIds[index]) {
        changed = true;
      }
      updatedSkillCardIds[index] = cardId;
      let chunks = [];
      for (let i = 0; i < updatedSkillCardIds.length; i += 6) {
        chunks.push(updatedSkillCardIds.slice(i, i + 6));
      }
      return chunks;
    });
    if (changed) {
      replaceCustomizations(index, []);
    }
  }

  function replaceCustomizations(index, customizations) {
    setCustomizationGroups((cur) => {
      const curCustomizations = [].concat(...cur);
      const updatedCustomizations = [...curCustomizations];
      updatedCustomizations[index] = customizations;
      let chunks = [];
      for (let i = 0; i < updatedCustomizations.length; i += 6) {
        chunks.push(updatedCustomizations.slice(i, i + 6));
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
    setCustomizationGroups((cur) => {
      const updatedCustomizations = [...cur];
      updatedCustomizations.splice(groupIndex, 0, []);
      return updatedCustomizations;
    });
  };

  const deleteSkillCardIdGroup = (groupIndex) => {
    setSkillCardIdGroups((cur) => {
      const updatedSkillCardIds = [...cur];
      updatedSkillCardIds.splice(groupIndex, 1);
      return updatedSkillCardIds;
    });
    setCustomizationGroups((cur) => {
      const updatedCustomizations = [...cur];
      updatedCustomizations.splice(groupIndex, 1);
      return updatedCustomizations;
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
    setCustomizationGroups((cur) => {
      const updatedCustomizations = [...cur];
      const temp = updatedCustomizations[groupIndexA];
      updatedCustomizations[groupIndexA] = updatedCustomizations[groupIndexB];
      updatedCustomizations[groupIndexB] = temp;
      return updatedCustomizations;
    });
  };

  function setMemory(memory, index) {
    const multiplier = index ? 0.2 : 1;

    if (!memoryParams.some((p) => p)) {
      setParams([0, 0, 0, 0]);
    } else if (memoryParams[index]) {
      // If there is currently a memory in that slot, remove its params
      setParams((curParams) =>
        curParams.map(
          (p, i) => (p || 0) - Math.floor(memoryParams[index][i] * multiplier)
        )
      );
    }

    // Set memory
    setMemoryParams((cur) => {
      const next = [...cur];
      next[index] = memory.params;
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
    setCustomizationGroups((cur) => {
      const next = [...cur];
      next[index] = memory.customizations || [];
      return next;
    });
  }

  const simulatorUrl = getSimulatorUrl(
    stageId,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups
  );

  let kafeUrl = null;
  let stage = FALLBACK_STAGE;
  if (stageId == "custom") {
    stage = customStage;
  } else if (stageId) {
    stage = Stages.getById(stageId);
    if (stage.type == "contest") {
      kafeUrl = generateKafeUrl(
        stage,
        supportBonus,
        params,
        pItemIds,
        skillCardIdGroups
      );
    }
  }

  const loadout = {
    stageId,
    customStage: stageId == "custom" ? customStage : {},
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
  };

  const pushLoadoutHistory = () => {
    if (JSON.stringify(loadout) == JSON.stringify(loadoutHistory[0])) return;
    setLoadoutHistory((cur) => [loadout, ...cur].slice(0, 10));
  };

  return (
    <LoadoutContext.Provider
      value={{
        loadout,
        setLoadout,
        setMemory,
        setStageId,
        setCustomStage,
        setSupportBonus,
        setParams,
        replacePItemId,
        replaceSkillCardId,
        replaceCustomizations,
        clear,
        insertSkillCardIdGroup,
        deleteSkillCardIdGroup,
        swapSkillCardIdGroups,
        stage,
        simulatorUrl,
        kafeUrl,
        loadoutHistory,
        pushLoadoutHistory,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
