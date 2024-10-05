import React, { memo } from "react";
import { useTranslations } from "next-intl";
import AddCard from "./AddCard";
import Diff from "./Diff";
import Group from "./Group";
import Hand from "./Hand";
import SetScoreBuff from "./SetScoreBuff";
import StartTurn from "./StartTurn";
import Tile from "./Tile";
import styles from "./SimulatorLogs.module.scss";

function Log({ line, idolId }) {
  const t = useTranslations("stage");

  if (line.logType == "diff") {
    return <Diff {...line.data} />;
  }
  if (line.logType == "drawCard") {
    return <AddCard {...line.data} idolId={idolId} text={t("cardDrawn")} />;
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
    return <Tile text={t("setEffect")} />;
  }
  if (line.logType == "upgradeHand") {
    return <Tile text={t("upgradedHand")} />;
  }
  if (line.logType == "exchangeHand") {
    return <Tile text={t("exchangedHand")} />;
  }
  if (line.logType == "addRandomUpgradedCardToHand") {
    return (
      <AddCard {...line.data} idolId={idolId} text={t("addedCardToHand")} />
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
