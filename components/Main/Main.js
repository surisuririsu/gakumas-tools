import { useContext } from "react";
import Dex from "@/components/Dex";
import Memories from "@/components/Memories";
import MemoryEditor from "@/components/MemoryEditor";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import Widget from "@/components/Widget";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Main.module.scss";

export default function Home() {
  const { showProduceRankCalculator, showDex, showMemoryEditor, showMemories } =
    useContext(WorkspaceContext);

  return (
    <main className={styles.main}>
      {showProduceRankCalculator && (
        <Widget title="Produce Rank Calculator">
          <ProduceRankCalculator />
        </Widget>
      )}
      {showDex && (
        <Widget title="Index">
          <Dex />
        </Widget>
      )}
      {showMemoryEditor && (
        <Widget title="Memory Editor" fill>
          <MemoryEditor />
        </Widget>
      )}
      {showMemories && (
        <Widget title="Memories">
          <Memories />
        </Widget>
      )}
    </main>
  );
}
