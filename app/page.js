"use client";
import { SessionProvider } from "next-auth/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { DataContextProvider } from "@/contexts/DataContext";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { SearchContextProvider } from "@/contexts/SearchContext";
import { SelectionContextProvider } from "@/contexts/SelectionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home() {
  return (
    <WorkspaceContextProvider>
      <SessionProvider>
        <Navbar />
        <DataContextProvider>
          <SelectionContextProvider>
            <MemoryContextProvider>
              <SearchContextProvider>
                <DndProvider backend={HTML5Backend}>
                  <Main />
                </DndProvider>
              </SearchContextProvider>
            </MemoryContextProvider>
          </SelectionContextProvider>
        </DataContextProvider>
        <Footer />
      </SessionProvider>
    </WorkspaceContextProvider>
  );
}
