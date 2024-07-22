"use client";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import Navbar from "@/components/Navbar";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";

export default function Home(props) {
  return (
    <SessionProvider>
      <WorkspaceContextProvider>
        <Navbar />
        <Main />
        <Footer />
      </WorkspaceContextProvider>
    </SessionProvider>
  );
}
