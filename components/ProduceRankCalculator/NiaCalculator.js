"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import IconSelect from "@/components/IconSelect";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import { getRank } from "@/utils/produceRank";
import styles from "./ProduceRankCalculator.module.scss";
import ParamOrderPicker from "../ParamOrderPicker";
import { calculateAuditionBonusParams } from "@/utils/nia";

const MAX_PARAMS = 2000;
const VOTE_RANK_OPTIONS = ["A+", "S", "S+", "SS"].map((r) => ({
  id: r,
  iconSrc: `/ranks/${r}.png`,
  alt: r,
}));
const FAN_RATING_BY_VOTE_RANK = {
  "A+": { base: 900, multiplier: 0.07 },
  S: { base: 1200, multiplier: 0.065 },
  "S+": { base: 1600, multiplier: 0.06 },
  SS: { base: 2100, multiplier: 0.055 },
};

export default function NiaCalculator() {
  const t = useTranslations("ProduceRankCalculator");

  const [params, setParams] = useState([null, null, null]);
  const [paramBonuses, setParamBonuses] = useState([null, null, null]);
  const [votes, setVotes] = useState(0);
  const [scores, setScores] = useState([null, null, null]);
  const [voteRank, setVoteRank] = useState("S");
  const [paramOrder, setParamOrder] = useState([1, 2, 3]);

  console.log(paramOrder);

  const paramRating = Math.floor(
    params.reduce((acc, cur) => acc + cur, 0) * 2.3
  );
  const { base, multiplier } = FAN_RATING_BY_VOTE_RANK[voteRank];
  const fanRating = base + Math.ceil(votes * multiplier);

  const actualRating = paramRating + fanRating;
  const actualRank = getRank(actualRating);

  const auditionBonusParams = calculateAuditionBonusParams(paramOrder, scores);

  return (
    <>
      <span>{t("niaNote")}</span>

      <label>Evaluation criteria</label>
      <ParamOrderPicker initialOrder={paramOrder} onChange={setParamOrder} />

      <h3>オーディション前</h3>

      <label>{t("parametersPreAudition")}</label>
      <ParametersInput
        parameters={params}
        max={MAX_PARAMS}
        onChange={setParams}
      />

      <label>Param bonus %</label>
      <ParametersInput
        parameters={paramBonuses}
        max={MAX_PARAMS}
        onChange={setParamBonuses}
        round={false}
      />

      {/* <label>{t("parametersPostAudition")}</label>
      <ParametersInput
        parameters={params}
        max={MAX_PARAMS}
        onChange={setParams}
      /> */}

      <label>Votes</label>
      <Input
        type="number"
        value={votes || ""}
        placeholder={t("voteCount")}
        onChange={setVotes}
        min={0}
        max={10000000}
      />

      <label>Scores</label>
      <ParametersInput
        parameters={scores}
        max={10000000}
        onChange={setScores}
      />

      {JSON.stringify(auditionBonusParams)}
      {/*
      <label>{t("voteCountRank")}</label>
      <div className={styles.rankSelect}>
        <IconSelect
          options={VOTE_RANK_OPTIONS}
          selected={voteRank}
          onChange={setVoteRank}
        />
      </div> */}

      {/* {!!params.every((p) => !!p) && (
        <>
          <label>{t("produceRank")}</label>
          <span>
            {actualRating} {actualRank ? `(${actualRank})` : null}
          </span>
        </>
      )} */}
    </>
  );
}
