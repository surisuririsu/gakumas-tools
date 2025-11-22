"use client";
import { createContext, useContext } from "react";
import LoadoutContext from "@/contexts/LoadoutContext";

const LoadoutApiContext = createContext();

export function LoadoutApiContextProvider({ children }) {
  const { loadout } = useContext(LoadoutContext);

  async function saveLoadout(name) {
    const response = await fetch("/api/loadout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...loadout, name }),
    });
    const data = await response.json();
    return data.id;
  }

  async function fetchLoadouts() {
    const response = await fetch("/api/loadout");
    return response.json();
  }

  async function deleteLoadouts(ids) {
    await fetch("/api/loadout", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  return (
    <LoadoutApiContext.Provider
      value={{ saveLoadout, fetchLoadouts, deleteLoadouts }}
    >
      {children}
    </LoadoutApiContext.Provider>
  );
}

export default LoadoutApiContext;
