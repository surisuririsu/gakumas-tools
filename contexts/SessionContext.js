"use client";
import { SessionProvider } from "next-auth/react";

export function SessionContextProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
