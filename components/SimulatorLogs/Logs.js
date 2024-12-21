import React, { memo } from "react";
import { useTranslations } from "next-intl";
import AddCard from "./AddCard";
import Diff from "./Diff";
import Group from "./Group";
import Hand from "./Hand";
import SetScoreBuff from "./SetScoreBuff";
import Tile from "./Tile";
import Turn from "./Turn";
import styles from "./SimulatorLogs.module.scss";

function Log({ line, idolId }) {
  const t = useTranslations("stage");

  if (line.logType == "diff") {
    return <Diff {...line.data} />;
  } else if (line.logType == "drawCard") {
    return <AddCard {...line.data} idolId={idolId} text={t("cardDrawn")} />;
  } else if (line.logType == "hand") {
    return <Hand {...line.data} idolId={idolId} />;
  } else if (line.logType == "group") {
    return (
      <Group entity={line.entity} childLogs={line.childLogs} idolId={idolId} />
    );
  } else if (line.logType == "turn") {
    return <Turn {...line.data} childLogs={line.childLogs} idolId={idolId} />;
  } else if (line.logType == "setScoreBuff") {
    return <SetScoreBuff {...line.data} />;
  } else if (line.logType == "setEffect") {
    return <Tile text={t("setEffect")} />;
  } else if (line.logType == "upgradeHand") {
    return <Tile text={t("upgradedHand")} />;
  } else if (line.logType == "exchangeHand") {
    return <Tile text={t("exchangedHand")} />;
  } else if (line.logType == "addRandomUpgradedCardToHand") {
    return (
      <AddCard {...line.data} idolId={idolId} text={t("addedCardToHand")} />
    );
  } else if (line.logType == "upgradeRandomCardInHand") {
    return <AddCard {...line.data} idolId={idolId} text={t("upgradedCard")} />;
  } else if (line.logType == "growth") {
    return <AddCard {...line.data} idolId={idolId} text={t("cardGrowth")} />;
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
