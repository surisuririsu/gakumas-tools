"use client";
import { memo, useMemo, useState } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
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

  const targetScores = useMemo(
    () => calculateTargetScores(ratingExExamScore),
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
        options={[
          { value: "regular", label: "レギュラー" },
          { value: "pro", label: "プロ" },
          { value: "master", label: "マスター" },
        ]}
        selected={difficulty}
        onChange={setDifficulty}
      />
      <div className={styles.bonus}>パラメータ上限: {maxParams}</div>

      <label>最終試験順位</label>
      <ButtonGroup
        options={[
          { value: 1, label: "1位" },
          { value: 2, label: "2位" },
          { value: 3, label: "3位" },
          { value: 4, label: "4位以下" },
        ]}
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
          <table className={styles.result}>
            <thead>
              <tr>
                <th>評価</th>
                <th>目標スコア</th>
              </tr>
            </thead>
            <tbody>
              {targetScores.map(({ rank, score }) => (
                <tr key={rank}>
                  <td>
                    {rank} ({TARGET_RATING_BY_RANK[rank]})
                  </td>
                  <td>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>

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
