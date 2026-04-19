"use client";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import DifficultyPicker from "@/components/DifficultyPicker";
import Input from "@/components/Input";
import Panel from "@/components/Panel";
import ParametersInput from "@/components/ParametersInput";
import ProduceRankResult from "@/components/ProduceRankResult";
import Table from "@/components/Table";
import {
  calculateActualRating,
  calculateRatingExExamScore,
  calculateTargetScores,
  getRank,
  MAX_PARAMS_BY_DIFFICULTY,
  PARAM_BONUS_BY_PLACE,
  PARAM_BONUS_BY_PLACE_LEGEND,
  TARGET_RATING_BY_RANK,
} from "@/utils/produceRank";
import styles from "./ProduceRankCalculator.module.scss";

function HajimeCalculator() {
  const t = useTranslations("Calculator");

  const DIFFICULTIES = ["regular", "pro", "master", "legend"];

  const EXAM_PLACE_OPTIONS = [1, 2, 3, 4].map((place) => ({
    value: place,
    label: t(`places.${place}`),
  }));

  const TABLE_HEADERS = [t("produceRank"), t("targetScore")];

  const [difficulty, setDifficulty] = useState("legend");
  const [place, setPlace] = useState(1);
  const [params, setParams] = useState([null, null, null]);
  const [midtermScore, setMidtermScore] = useState("");
  const [actualScore, setActualScore] = useState("");

  const maxParams = MAX_PARAMS_BY_DIFFICULTY[difficulty];
  const placeParamBonus =
    difficulty === "legend"
      ? PARAM_BONUS_BY_PLACE_LEGEND[place]
      : PARAM_BONUS_BY_PLACE[place];
  const ratingExExamScore = calculateRatingExExamScore(
    place,
    params,
    maxParams,
    midtermScore,
    difficulty
  );

  const targetScoreRows = calculateTargetScores(
    ratingExExamScore,
    difficulty
  ).map(({ rank, score }) => [
    `${rank} (${TARGET_RATING_BY_RANK[rank].toLocaleString()})`,
    score.toLocaleString(),
  ]);
  const actualRating = calculateActualRating(
    actualScore,
    ratingExExamScore,
    difficulty
  );
  const actualRank = getRank(actualRating);

  return (
    <>
      <label>{t("difficulty")}</label>
      <DifficultyPicker
        difficulties={DIFFICULTIES}
        selected={difficulty}
        onChange={setDifficulty}
      />
      <div className={styles.bonus}>
        {t("parameterLimit")}: {maxParams}
      </div>

      {difficulty === "legend" && (
        <>
          <label>{t("midtermScore")}</label>
          <Input
            type="number"
            value={midtermScore || ""}
            placeholder={t("midtermScore")}
            onChange={setMidtermScore}
            min={0}
            max={10000000}
          />
        </>
      )}

      <label>{t("finalExamPlacement")}</label>
      <ButtonGroup
        options={EXAM_PLACE_OPTIONS}
        selected={place}
        onChange={setPlace}
      />
      <div className={styles.bonus}>
        {t("parameter")}: +{placeParamBonus}
      </div>

      <label>{t("parameters")}</label>
      <ParametersInput
        parameters={params}
        max={maxParams}
        onChange={setParams}
      />

      <label>{t("targetScores")}</label>
      <Table headers={TABLE_HEADERS} rows={targetScoreRows} />

      <label>{t("score")}</label>
      <Input
        type="number"
        value={actualScore || ""}
        placeholder={t("score")}
        onChange={setActualScore}
        min={0}
        max={10000000}
      />

      {!!actualScore && (
        <Panel label={t("produceRank")}>
          <ProduceRankResult rating={actualRating} rank={actualRank} />
        </Panel>
      )}
    </>
  );
}

export default memo(HajimeCalculator);
