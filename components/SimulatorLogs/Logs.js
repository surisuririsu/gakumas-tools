import React, { memo } from "react";
import AddCard from "./AddCard";
import Diff from "./Diff";
import Group from "./Group";
import Hand from "./Hand";
import SetScoreBuff from "./SetScoreBuff";
import StartTurn from "./StartTurn";
import Text from "./Text";
import Tile from "./Tile";
import styles from "./SimulatorLogs.module.scss";

function Log({ line, idolId }) {
  if (line.logType == "diff") {
    return <Diff {...line.data} />;
  }
  if (line.logType == "drawCard") {
    return (
      <AddCard {...line.data} idolId={idolId} text="スキルカードを引いた" />
    );
  }
  if (line.logType == "hand") {
    return <Hand {...line.data} idolId={idolId} />;
  }
  if (line.logType == "group") {
    return (
      <Group entity={line.entity} childLogs={line.childLogs} idolId={idolId} />
    );
  }
  if (line.logType == "startTurn") {
    return <StartTurn {...line.data} />;
  }
  if (line.logType == "setScoreBuff") {
    return <SetScoreBuff {...line.data} />;
  }
  if (line.logType == "setEffect") {
    return <Text>持続効果付与</Text>;
  }
  if (line.logType == "upgradeHand") {
    return <Tile text="手札をすべてレッスン中強化" />;
  }
  if (line.logType == "exchangeHand") {
    return <Tile text="手札をすべて入れ替える" />;
  }
  if (line.logType == "addRandomUpgradedCardToHand") {
    return (
      <AddCard {...line.data} idolId={idolId} text="スキルカードを手札に生成" />
    );
  }
}

function Logs({ logs, idolId }) {
  return (
    <div className={styles.logs}>
      {logs.map((line, i) => (
        <Log key={i} line={line} idolId={idolId} />
      ))}
    </div>
  );
}

export default memo(Logs);
