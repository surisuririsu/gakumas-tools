"use client";
import { SessionProvider } from "next-auth/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { SelectionContextProvider } from "@/contexts/SelectionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home() {
  return (
    <SessionProvider>
      <WorkspaceContextProvider>
        <Navbar />
        <SelectionContextProvider>
          <MemoryContextProvider>
            <DndProvider backend={HTML5Backend}>
              <Main />
            </DndProvider>
          </MemoryContextProvider>
        </SelectionContextProvider>
        <Footer />
      </WorkspaceContextProvider>
    </SessionProvider>
  );
}
