import { useContext } from "react";
import Dex from "@/components/Dex";
import Memories from "@/components/Memories";
import MemoryEditor from "@/components/MemoryEditor";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";
import Welcome from "@/components/Welcome";
import Widget from "@/components/Widget";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Main.module.scss";

export default function Home() {
  const { openWidgets } = useContext(WorkspaceContext);

  return (
    <main className={styles.main}>
      {openWidgets.produceRankCalculator && (
        <Widget title="Produce Rank Calculator">
          <ProduceRankCalculator />
        </Widget>
      )}
      {openWidgets.dex && (
        <Widget title="Index">
          <Dex />
        </Widget>
      )}
      {openWidgets.memoryEditor && (
        <Widget title="Memory Editor" fill>
          <MemoryEditor />
        </Widget>
      )}
      {openWidgets.memories && (
        <Widget title="Memories">
          <Memories />
        </Widget>
      )}
      {!Object.values(openWidgets).some((v) => v) && <Welcome />}
    </main>
  );
}
