"use client";
import { SessionProvider } from "next-auth/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { DataContextProvider } from "@/contexts/DataContext";
import { EntityContextProvider } from "@/contexts/EntityContext";
import { LoadoutContextProvider } from "@/contexts/LoadoutContext";
import { MemoryCalculatorContextProvider } from "@/contexts/MemoryCalculatorContext";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { SearchContextProvider } from "@/contexts/SearchContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home() {
  return (
    <>
      <GoogleAnalytics />
      <WorkspaceContextProvider>
        <SessionProvider>
          <Navbar />
          <DataContextProvider>
            <MemoryCalculatorContextProvider>
              <MemoryContextProvider>
                <SearchContextProvider>
                  <LoadoutContextProvider>
                    <EntityContextProvider>
                      <DndProvider backend={HTML5Backend}>
                        <Main />
                      </DndProvider>
                    </EntityContextProvider>
                  </LoadoutContextProvider>
                </SearchContextProvider>
              </MemoryContextProvider>
            </MemoryCalculatorContextProvider>
          </DataContextProvider>
          <Footer />
        </SessionProvider>
      </WorkspaceContextProvider>
    </>
  );
}
