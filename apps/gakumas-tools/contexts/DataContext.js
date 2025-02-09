"use client";
import { createContext, useState } from "react";
import { useSession } from "next-auth/react";

const DataContext = createContext();

export function DataContextProvider({ children }) {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  async function fetchMemories() {
    if (status == "authenticated" && !memoriesLoading) {
      setMemoriesLoading(true);
      const response = await fetch("/api/memory");
      const data = await response.json();
      setMemories(data.memories);
      setMemoriesLoading(false);
    }
  }

  async function uploadMemories(memories) {
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memories }),
    });

    fetchMemories();
  }

  async function deleteMemories(memoryIds) {
    await fetch("/api/memory/bulk_delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: memoryIds }),
    });

    fetchMemories();
  }

  return (
    <DataContext.Provider
      value={{
        memories,
        fetchMemories,
        uploadMemories,
        deleteMemories,
        memoriesLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export default DataContext;
