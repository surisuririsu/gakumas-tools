"use client";
import { createContext, useCallback, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      `${options?.method || "GET"} ${url} failed with ${response.status}`
    );
  }
  return response;
}

function postJson(url, body) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  // One of "load" | "upload" | "delete" when the last request failed.
  const [memoriesError, setMemoriesError] = useState(null);
  const loadingRef = useRef(false);

  const fetchMemories = useCallback(async () => {
    if (status != "authenticated" || loadingRef.current) return;
    loadingRef.current = true;
    setMemoriesLoading(true);
    setMemoriesError(null);
    try {
      const response = await request("/api/memory");
      const data = await response.json();
      setMemories(data.memories);
    } catch (error) {
      console.error(error);
      setMemoriesError("load");
    } finally {
      loadingRef.current = false;
      setMemoriesLoading(false);
    }
  }, [status]);

  const mutateMemories = useCallback(
    async (action, url, body) => {
      setMemoriesError(null);
      try {
        await postJson(url, body);
        return true;
      } catch (error) {
        console.error(error);
        setMemoriesError(action);
        return false;
      } finally {
        fetchMemories();
      }
    },
    [fetchMemories]
  );

  const uploadMemories = useCallback(
    (memories) => mutateMemories("upload", "/api/memory", { memories }),
    [mutateMemories]
  );

  const deleteMemories = useCallback(
    (memoryIds) => {
      const ids = new Set(memoryIds);
      setMemories((cur) => cur.filter((memory) => !ids.has(memory._id)));
      return mutateMemories("delete", "/api/memory/bulk_delete", {
        ids: memoryIds,
      });
    },
    [mutateMemories]
  );

  const value = useMemo(
    () => ({
      memories,
      fetchMemories,
      uploadMemories,
      deleteMemories,
      memoriesLoading,
      memoriesError,
    }),
    [
      memories,
      fetchMemories,
      uploadMemories,
      deleteMemories,
      memoriesLoading,
      memoriesError,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export default DataContext;
