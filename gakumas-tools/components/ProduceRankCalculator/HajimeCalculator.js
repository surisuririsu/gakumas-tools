"use client";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import DifficultyPicker from "@/components/DifficultyPicker";
import Input from "@/components/Input";
import Panel from "@/components/Panel";
import ParametersInput from "@/components/ParametersInput";
import ProduceRankResult from "@/components/ProduceRankResult";
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
import InfoTag from "./InfoTag";
import TargetScoreTable from "./TargetScoreTable";
import styles from "./ProduceRankCalculator.module.scss";

const DIFFICULTIES = ["regular", "pro", "master", "legend"];

function HajimeCalculator() {
  const t = useTranslations("Calculator");

  const EXAM_PLACE_OPTIONS = [1, 2, 3, 4].map((place) => ({
    value: place,
    label: t(`places.${place}`),
  }));

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
    difficulty,
  );

  const targetScores = calculateTargetScores(ratingExExamScore, difficulty);
  const actualRating = calculateActualRating(
    actualScore,
    ratingExExamScore,
    difficulty,
  );
  const actualRank = getRank(actualRating);

  return (
    <div className={styles.stack}>
      <Panel
        label={t("difficulty")}
        headerAction={
          <InfoTag
            className={styles.headerTag}
            label={t("parameterLimit")}
            value={maxParams}
          />
        }
      >
        <DifficultyPicker
          difficulties={DIFFICULTIES}
          selected={difficulty}
          onChange={setDifficulty}
        />
      </Panel>

      <Panel className={styles.form}>
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

        <div className={styles.fieldHead}>
          <label>{t("finalExamPlacement")}</label>
          <InfoTag label={t("parameter")} value={`+${placeParamBonus}`} />
        </div>
        <ButtonGroup
          options={EXAM_PLACE_OPTIONS}
          selected={place}
          onChange={setPlace}
        />

        <label>{t("parameters")}</label>
        <ParametersInput
          parameters={params}
          max={maxParams}
          onChange={setParams}
        />

        <label>{t("score")}</label>
        <Input
          type="number"
          value={actualScore || ""}
          placeholder={t("score")}
          onChange={setActualScore}
          min={0}
          max={10000000}
        />
      </Panel>

      <Panel label={t("produceRank")}>
        <ProduceRankResult
          rating={actualRating}
          rank={actualRank}
          ratingByRank={TARGET_RATING_BY_RANK}
        />
      </Panel>

      <Panel label={t("targetScores")}>
        <TargetScoreTable
          targets={targetScores}
          ratingByRank={TARGET_RATING_BY_RANK}
        />
      </Panel>
    </div>
  );
}

export default memo(HajimeCalculator);
