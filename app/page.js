"use client";
import { SessionProvider } from "next-auth/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { DataContextProvider } from "@/contexts/DataContext";
import { LoadoutContextProvider } from "@/contexts/LoadoutContext";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { SearchContextProvider } from "@/contexts/SearchContext";
import { SelectionContextProvider } from "@/contexts/SelectionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home() {
  return (
    <>
      <GoogleAnalytics />
      <WorkspaceContextProvider>
        <SessionProvider>
          <Navbar />
          <DataContextProvider>
            <SelectionContextProvider>
              <MemoryContextProvider>
                <SearchContextProvider>
                  <LoadoutContextProvider>
                    <DndProvider backend={HTML5Backend}>
                      <Main />
                    </DndProvider>
                  </LoadoutContextProvider>
                </SearchContextProvider>
              </MemoryContextProvider>
            </SelectionContextProvider>
          </DataContextProvider>
          <Footer />
        </SessionProvider>
      </WorkspaceContextProvider>
    </>
  );
}
