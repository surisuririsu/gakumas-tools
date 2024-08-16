"use client";
import { memo, useMemo, useState } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import {
  PARAM_BONUS_BY_PLACE,
  RATING_BY_PLACE,
  REVERSE_RATING_REGIMES,
  TARGET_RATING_BY_RANK,
} from "@/utils/produceRank";
import styles from "./ProduceRankCalculator.module.scss";

function ProduceRankCalculator() {
  const [place, setPlace] = useState("1st");
  const [params, setParams] = useState([null, null, null]);
  const [actualScore, setActualScore] = useState(null);

  const placeRating = RATING_BY_PLACE[place];
  const placeParamBonus = PARAM_BONUS_BY_PLACE[place];
  const paramRating = Math.floor(
    params.reduce(
      (acc, cur) => acc + Math.min(cur + placeParamBonus, 1500),
      0
    ) * 2.3
  );
  const targetScores = useMemo(
    () =>
      Object.keys(TARGET_RATING_BY_RANK)
        .map((rank) => {
          const targetRating =
            TARGET_RATING_BY_RANK[rank] - placeRating - paramRating;
          for (let { threshold, base, multiplier } of REVERSE_RATING_REGIMES) {
            if (targetRating <= threshold) continue;
            return {
              rank,
              score: Math.floor(base + (targetRating - threshold) / multiplier),
            };
          }
          return { rank, score: 0 };
        })
        .filter((target) => !!target),
    [placeRating, paramRating]
  );

  const actualRating = useMemo(() => {
    let calcScore = actualScore;
    let actualRating = 0;
    for (let i = 0; calcScore > 0; i++) {
      const regimeAmount = i < 2 ? 5000 : 10000;
      actualRating +=
        (Math.min(calcScore, regimeAmount) *
          Math.round((0.3 * 100) / Math.pow(2, i))) /
        100;
      calcScore -= regimeAmount;
    }
    return Math.round(actualRating) + placeRating + paramRating;
  }, [actualScore, placeRating, paramRating]);

  const actualRank = useMemo(() => {
    for (let rank in TARGET_RATING_BY_RANK) {
      if (actualRating >= TARGET_RATING_BY_RANK[rank]) return rank;
    }
    return null;
  }, [actualRating]);

  return (
    <div className={styles.produceRankCalculator}>
      <label>Final exam placement</label>
      <ButtonGroup
        options={["1st", "2nd", "3rd", "Other"]}
        selected={place}
        onChange={setPlace}
      />
      <div className={styles.bonus}>Bonus parameter: +{placeParamBonus}</div>

      <label>Parameters</label>
      <ParametersInput parameters={params} onChange={setParams} />

      {!!params.every((p) => !!p) && (
        <>
          <label>Target exam scores</label>
          <table className={styles.result}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Target exam score</th>
              </tr>
            </thead>
            <tbody>
              {targetScores.map(({ rank, score }) => (
                <tr key={rank}>
                  <td>{rank}</td>
                  <td>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <label>Exam score</label>
          <Input
            type="number"
            value={actualScore}
            placeholder="Exam score"
            onChange={setActualScore}
            min={0}
            max={1000000}
          />

          {actualScore && (
            <>
              <label>Produce rating</label>
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
