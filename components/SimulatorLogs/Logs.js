import React from "react";
import Diff from "./Diff";
import AddCard from "./AddCard";
import Group from "./Group";
import StartTurn from "./StartTurn";
import styles from "./SimulatorLogs.module.scss";

export default function Logs({ logs, idolId }) {
  return (
    <div className={styles.logs}>
      {logs.map((line, i) => (
        <React.Fragment key={i}>
          {line.logType == "startTurn" && <StartTurn {...line.data} />}
          {line.logType == "drawCard" && (
            <AddCard
              {...line.data}
              idolId={idolId}
              text="スキルカードを引いた"
            />
          )}
          {line.logType == "group" && (
            <Group
              entity={line.entity}
              childLogs={line.childLogs}
              idolId={idolId}
            />
          )}
          {line.logType == "diff" && <Diff {...line.data} />}
          {line.logType == "upgradeHand" && (
            <Tile text="手札をすべてレッスン中強化" />
          )}
          {line.logType == "exchangeHand" && (
            <Tile text="手札をすべて入れ替える" />
          )}
          {line.logType == "addRandomUpgradedCardToHand" && (
            <AddCard
              {...line.data}
              idolId={idolId}
              text="スキルカードを手札に生成"
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
