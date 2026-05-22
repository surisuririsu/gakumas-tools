"use client";
import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import Panel from "@/components/Panel";
import ParametersInput from "@/components/ParametersInput";
import ProduceRankResult from "@/components/ProduceRankResult";
import Table from "@/components/Table";
import {
  calculateTargetRound2Scores,
  calculateTotalEvaluation,
  getEffectiveRound2StarGain,
  getRank,
  MAX_PARAM,
  MAX_PRE_ROUND2_STAR,
  MAX_ROUND1_SCORE,
  MAX_ROUND2_SCORE,
  MAX_TOTAL_SCORE,
  TARGET_RATING_BY_RANK,
} from "@/utils/hif";
import styles from "./HifCalculator.module.scss";

const SCORE_MODES = ["total", "split"];

function HifCalculator() {
  const t = useTranslations("Calculator");

  const SCORE_MODE_OPTIONS = SCORE_MODES.map((mode) => ({
    value: mode,
    label: t(`hifScoreModes.${mode}`),
  }));

  const TABLE_HEADERS = [t("produceRank"), t("targetScore")];

  const [params, setParams] = useState([null, null, null]);
  const [preRound2Star, setPreRound2Star] = useState(null);
  const [scoreMode, setScoreMode] = useState("total");
  const [leftScore, setLeftScore] = useState(null);
  const [round2Score, setRound2Score] = useState(null);

  const round1Score = useMemo(() => {
    const left = leftScore || 0;
    const r2 = round2Score || 0;
    if (scoreMode === "total") return left - r2;
    return left;
  }, [scoreMode, leftScore, round2Score]);

  const totalScore = round1Score + (round2Score || 0);

  const effectiveStarGain = getEffectiveRound2StarGain(round2Score || 0);

  const allEmpty =
    !params.some((p) => p) &&
    !preRound2Star &&
    !leftScore &&
    !round2Score;

  const totalEvaluation = allEmpty
    ? 0
    : calculateTotalEvaluation({
        params,
        preRound2Star: preRound2Star || 0,
        round1Score,
        round2Score: round2Score || 0,
      });
  const rank = allEmpty ? "?" : getRank(totalEvaluation) || "?";

  const targetRows = useMemo(
    () =>
      calculateTargetRound2Scores({
        params,
        preRound2Star: preRound2Star || 0,
        round1Score,
        currentRound2Score: round2Score || 0,
      }).map(({ rank: r, score }) => {
        let cell;
        if (score === "achieved") cell = "—";
        else if (score === "impossible") cell = "∞";
        else cell = score.toLocaleString();
        return [
          `${r} (${TARGET_RATING_BY_RANK[r].toLocaleString()})`,
          cell,
        ];
      }),
    [params, preRound2Star, round1Score, round2Score],
  );

  const leftMax =
    scoreMode === "total" ? MAX_TOTAL_SCORE : MAX_ROUND1_SCORE;
  const leftLabel =
    scoreMode === "total" ? t("hifTotalScore") : t("hifRound1Score");
  const derivedLabel =
    scoreMode === "total"
      ? t("hifDerivedRound1", { value: round1Score.toLocaleString() })
      : t("hifDerivedTotal", { value: totalScore.toLocaleString() });

  return (
    <div className={styles.hif}>
      <Panel label={t("preRound2")}>
        <div className={styles.stack}>
          <div className={styles.field}>
            <label>{t("parameters")}</label>
            <ParametersInput
              parameters={params}
              max={MAX_PARAM}
              onChange={setParams}
            />
          </div>

          <div className={styles.field}>
            <label>{t("star")}</label>
            <Input
              type="number"
              value={preRound2Star ?? ""}
              placeholder="0"
              onChange={setPreRound2Star}
              min={0}
              max={MAX_PRE_ROUND2_STAR}
            />
          </div>
        </div>
      </Panel>

      <Panel label={t("examScore")}>
        <div className={styles.modeRow}>
          <ButtonGroup
            options={SCORE_MODE_OPTIONS}
            selected={scoreMode}
            onChange={setScoreMode}
          />
        </div>

        <div className={styles.scoreGrid}>
          <div className={styles.field}>
            <label>{leftLabel}</label>
            <Input
              type="number"
              value={leftScore ?? ""}
              placeholder="0"
              onChange={setLeftScore}
              min={0}
              max={leftMax}
            />
            <div className={styles.hint}>{derivedLabel}</div>
          </div>

          <div className={styles.field}>
            <label>{t("hifRound2Score")}</label>
            <Input
              type="number"
              value={round2Score ?? ""}
              placeholder="0"
              onChange={setRound2Score}
              min={0}
              max={MAX_ROUND2_SCORE}
            />
            <div className={styles.hint}>
              {t("hifRound2StarGain", { value: effectiveStarGain })}
            </div>
          </div>
        </div>
      </Panel>

      <Panel label={t("produceRank")} className={styles.resultPanel}>
        <ProduceRankResult rating={totalEvaluation} rank={rank} />

        <label>{t("hifTargetRound2Scores")}</label>
        <Table headers={TABLE_HEADERS} rows={targetRows} />
      </Panel>
    </div>
  );
}

export default memo(HifCalculator);
