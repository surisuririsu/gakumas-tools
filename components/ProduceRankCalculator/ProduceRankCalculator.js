"use client";
import { memo, useMemo, useState } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import Table from "@/components/Table";
import {
  calculateActualRating,
  calculateRatingExExamScore,
  calculateTargetScores,
  getRank,
  MAX_PARAMS_BY_DIFFICULTY,
  PARAM_BONUS_BY_PLACE,
  TARGET_RATING_BY_RANK,
} from "@/utils/produceRank";
import styles from "./ProduceRankCalculator.module.scss";

const DIFFICULTY_OPTIONS = [
  { value: "regular", label: "レギュラー" },
  { value: "pro", label: "プロ" },
  { value: "master", label: "マスター" },
];

const EXAM_PLACE_OPTIONS = [
  { value: 1, label: "1位" },
  { value: 2, label: "2位" },
  { value: 3, label: "3位" },
  { value: 4, label: "4位以下" },
];

const TABLE_HEADERS = ["評価", "目標スコア"];

function ProduceRankCalculator() {
  const [difficulty, setDifficulty] = useState("pro");
  const [place, setPlace] = useState(1);
  const [params, setParams] = useState([null, null, null]);
  const [actualScore, setActualScore] = useState(null);

  const maxParams = MAX_PARAMS_BY_DIFFICULTY[difficulty];
  const placeParamBonus = PARAM_BONUS_BY_PLACE[place];
  const ratingExExamScore = calculateRatingExExamScore(
    place,
    params,
    maxParams
  );

  const targetScoreRows = useMemo(
    () =>
      calculateTargetScores(ratingExExamScore).map(({ rank, score }) => [
        `${rank} (${TARGET_RATING_BY_RANK[rank]})`,
        score,
      ]),
    [ratingExExamScore]
  );
  const actualRating = useMemo(
    () => calculateActualRating(actualScore, ratingExExamScore),
    [actualScore, ratingExExamScore]
  );
  const actualRank = useMemo(() => getRank(actualRating), [actualRating]);

  return (
    <div className={styles.produceRankCalculator}>
      <label>難易度</label>
      <ButtonGroup
        options={DIFFICULTY_OPTIONS}
        selected={difficulty}
        onChange={setDifficulty}
      />
      <div className={styles.bonus}>パラメータ上限: {maxParams}</div>

      <label>最終試験順位</label>
      <ButtonGroup
        options={EXAM_PLACE_OPTIONS}
        selected={place}
        onChange={setPlace}
      />
      <div className={styles.bonus}>パラメータ: +{placeParamBonus}</div>

      <label>パラメータ</label>
      <ParametersInput
        parameters={params}
        max={maxParams}
        onChange={setParams}
      />

      {!!params.every((p) => !!p) && (
        <>
          <label>目標スコア</label>
          <Table headers={TABLE_HEADERS} rows={targetScoreRows} />

          <label>スコア</label>
          <Input
            type="number"
            value={actualScore}
            placeholder="スコア"
            onChange={setActualScore}
            min={0}
            max={1000000}
          />

          {actualScore && (
            <>
              <label>プロデュース評価</label>
              <span>
                {actualRating} {actualRank ? `(${actualRank})` : null}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default memo(ProduceRankCalculator);
