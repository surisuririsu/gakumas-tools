"use client";
import { createContext, useState } from "react";
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

  async function fetchMemories() {
    if (status != "authenticated" || memoriesLoading) return;
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
      setMemoriesLoading(false);
    }
  }

  async function mutateMemories(action, url, body) {
    setMemoriesError(null);
    try {
      await postJson(url, body);
    } catch (error) {
      console.error(error);
      setMemoriesError(action);
      return;
    }
    fetchMemories();
  }

  function uploadMemories(memories) {
    return mutateMemories("upload", "/api/memory", { memories });
  }

  function deleteMemories(memoryIds) {
    return mutateMemories("delete", "/api/memory/bulk_delete", {
      ids: memoryIds,
    });
  }

  return (
    <DataContext.Provider
      value={{
        memories,
        fetchMemories,
        uploadMemories,
        deleteMemories,
        memoriesLoading,
        memoriesError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
