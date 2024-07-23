import { useContext } from "react";
import Dex from "@/components/Dex";
import MemoryEditor from "@/components/MemoryEditor";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import Widget from "@/components/Widget";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Main.module.scss";

export default function Home() {
  const { showProduceRankCalculator, showMemoryEditor, showDex } =
    useContext(WorkspaceContext);

  return (
    <main className={styles.main}>
      {showProduceRankCalculator && (
        <Widget title="Produce Rank Calculator">
          <ProduceRankCalculator />
        </Widget>
      )}
      {showMemoryEditor && (
        <Widget title="Memory Editor" fill>
          <MemoryEditor />
        </Widget>
      )}
      {showDex && (
        <Widget title="Index">
          <Dex />
        </Widget>
      )}
    </main>
  );
}
