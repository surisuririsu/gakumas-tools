import { Suspense } from "react";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getServerSession } from "next-auth";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import PinnedTools from "@/components/PinnedTools";
import ToolHeader from "@/components/ToolHeader";
import { DataContextProvider } from "@/contexts/DataContext";
import { LoadoutContextProvider } from "@/contexts/LoadoutContext";
import { MemoryCalculatorContextProvider } from "@/contexts/MemoryCalculatorContext";
import { MemoryContextProvider } from "@/contexts/MemoryContext";
import { ModalContextProvider } from "@/contexts/ModalContext";
import { SearchContextProvider } from "@/contexts/SearchContext";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { WorkspaceContextProvider } from "@/contexts/WorkspaceContext";
import { routing } from "@/i18n/routing";
import { authOptions } from "@/utils/auth";
import { GA_ID } from "@/utils/logging";
import { generateDefaultMetadata } from "@/utils/metadata";
import styles from "./layout.module.scss";
import "../globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({ params }) {
  const { locale } = await params;

  return await generateDefaultMetadata(locale);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ params, children }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <SessionContextProvider session={session}>
          <NextIntlClientProvider messages={messages}>
            <Navbar />
            <WorkspaceContextProvider>
              <DataContextProvider>
                <MemoryCalculatorContextProvider>
                  <MemoryContextProvider>
                    <SearchContextProvider>
                      <Suspense>
                        <LoadoutContextProvider>
                          <ModalContextProvider>
                            <div className={styles.tools}>
                              <PinnedTools />
                              <main>
                                <ToolHeader />
                                {children}
                              </main>
                            </div>
                          </ModalContextProvider>
                        </LoadoutContextProvider>
                      </Suspense>
                    </SearchContextProvider>
                  </MemoryContextProvider>
                </MemoryCalculatorContextProvider>
              </DataContextProvider>
            </WorkspaceContextProvider>
          </NextIntlClientProvider>
        </SessionContextProvider>
      </body>
      <GoogleAnalytics gaId={GA_ID} />
    </html>
  );
}
