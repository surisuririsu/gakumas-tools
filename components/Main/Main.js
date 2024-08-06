import { useContext } from "react";
import Dex from "@/components/Dex";
import LoadoutEditor from "@/components/LoadoutEditor";
import Memories from "@/components/Memories";
import MemoryCalculator from "@/components/MemoryCalculator";
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
      {openWidgets.memoryCalculator && (
        <Widget title="Memory Calculator (In dev)" fill>
          <MemoryCalculator />
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
      {openWidgets.loadoutEditor && (
        <Widget title="Loadout Editor" fill>
          <LoadoutEditor />
        </Widget>
      )}
      {!Object.values(openWidgets).some((v) => v) && <Welcome />}
    </main>
  );
}
