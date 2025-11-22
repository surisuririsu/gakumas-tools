"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Stages } from "gakumas-data";
import { usePathname } from "@/i18n/routing";
import LoadoutUrlContext from "@/contexts/LoadoutUrlContext";
import { getSimulatorUrl } from "@/utils/simulator";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { fixCustomizations } from "@/utils/customizations";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const pathname = usePathname();
  const { loadoutFromUrl, updateUrl } = useContext(LoadoutUrlContext);

  const [memoryParams, setMemoryParams] = useState([null, null]);
  const [stageId, setStageId] = useState(loadoutFromUrl.stageId);
  const [customStage, setCustomStage] = useState(null);
  const [supportBonus, setSupportBonus] = useState(loadoutFromUrl.supportBonus);
  const [params, setParams] = useState(loadoutFromUrl.params);
  const [pItemIds, setPItemIds] = useState(loadoutFromUrl.pItemIds);
  const [skillCardIdGroups, setSkillCardIdGroups] = useState(
    loadoutFromUrl.skillCardIdGroups
  );
  const [customizationGroups, setCustomizationGroups] = useState(
    loadoutFromUrl.customizationGroups
  );

  let stage = FALLBACK_STAGE;
  if (stageId == "custom") {
    stage = customStage;
  } else if (stageId) {
    stage = Stages.getById(stageId);
  }

  const loadout = useMemo(
    () => ({
      stageId,
      customStage: stageId == "custom" ? customStage : {},
      supportBonus,
      params,
      pItemIds,
      skillCardIdGroups,
      customizationGroups,
    }),
    [
      stageId,
      customStage,
      supportBonus,
      params,
      pItemIds,
      skillCardIdGroups,
      customizationGroups,
    ]
  );

  const [currentLoadoutIndex, setCurrentLoadoutIndex] = useState(0);
  const [loadouts, setLoadouts] = useState([loadout]);

  const simulatorUrl = getSimulatorUrl(loadout);

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

  useEffect(() => {
    if (stage.type !== "linkContest") return;
    if (loadouts.length == stage.linkTurnCounts.length) return;

    setLoadouts((cur) => {
      const next = [...cur];
      while (next.length < stage.linkTurnCounts.length) {
        next.push(loadout);
      }
      return next;
    });
  }, [stage]);

  // Update browser URL when the loadout changes
  useEffect(() => {
    if (pathname !== "/simulator") return;
    updateUrl(loadout);
  }, [loadout]);

  // Update link loadouts when loadout changes
  useEffect(() => {
    if (stage.type == "linkContest") {
      setLoadouts((cur) => {
        const next = [...cur];
        next[currentLoadoutIndex] = loadout;
        for (let i = 0; i < next.length; i++) {
          next[i].stageId = loadout.stageId;
          next[i].params = [...loadout.params.slice(0, 3), next[i].params[3]];
        }
        return next;
      });
    }
  }, [loadout]);

  useEffect(() => {
    // If fewer than 4 pItems, pad with 0s
    if (pItemIds.length < 4) {
      setPItemIds((cur) => cur.concat(new Array(4 - cur.length).fill(0)));
    }
  }, [pItemIds]);

  function clear() {
    setMemoryParams([null, null]);
    setParams([null, null, null, null]);
    setPItemIds([0, 0, 0, 0]);
    setSkillCardIdGroups([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]);
    setCustomizationGroups([
      [{}, {}, {}, {}, {}, {}],
      [{}, {}, {}, {}, {}, {}],
    ]);
  }

  function replacePItemId(index, itemId) {
    setPItemIds((cur) => {
      const next = [...cur];
      next[index] = itemId;
      return next;
    });
  }

  function swapPItemIds(indexA, indexB) {
    setPItemIds((cur) => {
      const next = [...cur];
      [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
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

  function swapSkillCardIds(indexA, indexB) {
    setSkillCardIdGroups((cur) => {
      const skillCardIds = [].concat(...cur);
      const temp = skillCardIds[indexA];
      skillCardIds[indexA] = skillCardIds[indexB];
      skillCardIds[indexB] = temp;
      let chunks = [];
      for (let i = 0; i < skillCardIds.length; i += 6) {
        chunks.push(skillCardIds.slice(i, i + 6));
      }
      return chunks;
    });

    setCustomizationGroups((cur) => {
      const curCustomizations = [].concat(...cur);
      const temp = curCustomizations[indexA];
      curCustomizations[indexA] = curCustomizations[indexB];
      curCustomizations[indexB] = temp;
      let chunks = [];
      for (let i = 0; i < curCustomizations.length; i += 6) {
        chunks.push(curCustomizations.slice(i, i + 6));
      }
      return chunks;
    });
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
    const multiplier = stage.type !== "linkContest" && index ? 0.2 : 1;

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
        swapPItemIds,
        replaceSkillCardId,
        swapSkillCardIds,
        replaceCustomizations,
        clear,
        insertSkillCardIdGroup,
        deleteSkillCardIdGroup,
        swapSkillCardIdGroups,
        stage,
        simulatorUrl,
        loadouts,
        setLoadouts,
        currentLoadoutIndex,
        setCurrentLoadoutIndex,
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
