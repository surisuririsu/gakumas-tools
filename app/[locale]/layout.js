import { Suspense } from "react";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  unstable_setRequestLocale,
} from "next-intl/server";
import GoogleAnalytics from "@/components/GoogleAnalytics";
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
import styles from "./layout.module.scss";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params: { locale } }) {
  unstable_setRequestLocale(locale);
  const messages = await getMessages();
  const session = await getServerSession(authOptions);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <GoogleAnalytics />
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
                                <div className={styles.mainContent}>
                                  {children}
                                </div>
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
    </html>
  );
}
