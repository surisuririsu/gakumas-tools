"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataContext from "@/contexts/DataContext";
import { getSimulatorUrl } from "@/utils/simulator";

const LOADOUT_STORAGE_KEY = "gakumas-tools.loadout";

const LoadoutContext = createContext();

export function LoadoutContextProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSimulatorOpen = pathname == "/simulator";
  let initialStageId = searchParams.get("stage");
  let initialSupportBonus = searchParams.get("support_bonus");
  let initialParams = searchParams.get("params");
  let initialPItemIds = searchParams.get("items");
  let initialSkillCardIdGroups = searchParams.get("cards");
  const hasDataFromParams =
    initialStageId ||
    initialParams ||
    initialPItemIds ||
    initialSkillCardIdGroups;

  initialStageId = initialStageId || "16";
  initialParams = initialParams || "1000-1000-1000-40";
  initialPItemIds = initialPItemIds || "0-0-0";
  initialSkillCardIdGroups =
    initialSkillCardIdGroups || "0-0-0-0-0-0_0-0-0-0-0-0";

  initialStageId = parseInt(initialStageId, 10) || null;
  initialSupportBonus = parseFloat(initialSupportBonus) || null;
  initialParams = initialParams.split("-").map((n) => parseInt(n, 10) || 0);
  initialPItemIds = initialPItemIds.split("-").map((n) => parseInt(n, 10) || 0);
  initialSkillCardIdGroups = initialSkillCardIdGroups
    .split("_")
    .map((group) => group.split("-").map((n) => parseInt(n, 10) || 0));

  const { memories } = useContext(DataContext);
  const [loaded, setLoaded] = useState(false);
  const [memoryIds, setMemoryIds] = useState([null, null]);
  const [stageId, setStageId] = useState(initialStageId);
  const [supportBonus, setSupportBonus] = useState(initialSupportBonus);
  const [params, setParams] = useState(initialParams);
  const [pItemIds, setPItemIds] = useState(initialPItemIds);
  const [skillCardIdGroups, setSkillCardIdGroups] = useState(
    initialSkillCardIdGroups
  );

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (isSimulatorOpen) {
      router.push(`/simulator?${createQueryString("stage", stageId)}`, {
        scroll: false,
      });
    }
  }, [stageId]);

  useEffect(() => {
    if (isSimulatorOpen) {
      router.push(
        `/simulator?${createQueryString("params", params.join("-"))}`,
        {
          scroll: false,
        }
      );
    }
  }, [params]);

  useEffect(() => {
    if (isSimulatorOpen) {
      router.push(
        `/simulator?${createQueryString("items", pItemIds.join("-"))}`,
        {
          scroll: false,
        }
      );
    }
  }, [pItemIds]);

  useEffect(() => {
    if (isSimulatorOpen) {
      router.push(
        `/simulator?${createQueryString(
          "cards",
          skillCardIdGroups.map((group) => group.join("-")).join("_")
        )}`,
        {
          scroll: false,
        }
      );
    }
  }, [skillCardIdGroups]);

  useEffect(() => {
    if (hasDataFromParams) {
      setLoaded(true);
      return;
    }
    const loadoutString = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (loadoutString) {
      const data = JSON.parse(loadoutString);
      if (data.memoryIds?.some((id) => id)) setMemoryIds(data.memoryIds);
      if (data.stageId) setStageId(data.stageId);
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
        params,
        pItemIds,
        skillCardIdGroups,
      })
    );
  }, [memoryIds, stageId, params, pItemIds, skillCardIdGroups]);

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
      cur[index] = memory.skillCardIds;
      return cur;
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

  return (
    <LoadoutContext.Provider
      value={{
        setMemory,
        stageId,
        setStageId,
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
      }}
    >
      {children}
    </LoadoutContext.Provider>
  );
}

export default LoadoutContext;
