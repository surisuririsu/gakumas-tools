"use client";
import { SessionProvider } from "next-auth/react";
import Footer from "@/components/Footer";
import MemoryEditor from "@/components/MemoryEditor";
import Navbar from "@/components/Navbar";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import Widget from "@/components/Widget";
import styles from "./page.module.scss";

export default function Home(props) {
  return (
    <SessionProvider>
      <Navbar />
      <main className={styles.main}>
        <Widget title="Produce Rank Calculator">
          <ProduceRankCalculator />
        </Widget>
        <Widget title="Memory Editor" fill>
          <MemoryEditor />
        </Widget>
      </main>
      <Footer />
    </SessionProvider>
  );
}
