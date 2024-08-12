import { Suspense } from "react";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Navbar from "@/components/Navbar";
import { DataContextProvider } from "@/contexts/DataContext";
import { LoadoutContextProvider } from "@/contexts/LoadoutContext";
import { MemoryCalculatorContextProvider } from "@/contexts/MemoryCalculatorContext";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { ModalContextProvider } from "@/contexts/ModalContext";
import { SearchContextProvider } from "@/contexts/SearchContext";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gakumas Tools",
  description:
    "Tools for playing Gakumas. Calculate the exam score required to achieve produce ranks, view P-item and skill card information, create your ideal contest loadouts, and more.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense>
          <GoogleAnalytics />
          <SessionContextProvider>
            <Navbar />
            <WorkspaceContextProvider>
              <DataContextProvider>
                <MemoryCalculatorContextProvider>
                  <MemoryContextProvider>
                    <SearchContextProvider>
                      <LoadoutContextProvider>
                        <ModalContextProvider>
                          <main>{children}</main>
                        </ModalContextProvider>
                      </LoadoutContextProvider>
                    </SearchContextProvider>
                  </MemoryContextProvider>
                </MemoryCalculatorContextProvider>
              </DataContextProvider>
            </WorkspaceContextProvider>
          </SessionContextProvider>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
