import { useContext } from "react";
import Welcome from "@/components/Welcome";
import Widget from "@/components/Widget";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { WIDGETS } from "@/utils/widgets";
import styles from "./Main.module.scss";

export default function Main() {
  const { openWidgets } = useContext(WorkspaceContext);

  return (
    <main className={styles.main}>
      {Object.keys(WIDGETS)
        .filter((widget) => openWidgets[widget])
        .map((widget) => {
          const { title, Component, fill } = WIDGETS[widget];
          return (
            <Widget key={widget} title={title} fill={fill}>
              <Component />
            </Widget>
          );
        })}

      {!Object.values(openWidgets).some((v) => v) && <Welcome />}
    </main>
  );
}
