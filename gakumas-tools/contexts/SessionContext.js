"use client";
import { SessionProvider } from "next-auth/react";

export function SessionContextProvider({ session, children }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
