"use client";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home() {
  return (
    <SessionProvider>
      <WorkspaceContextProvider>
        <MemoryContextProvider>
          <Navbar />
          <Main />
          <Footer />
        </MemoryContextProvider>
      </WorkspaceContextProvider>
    </SessionProvider>
  );
}
