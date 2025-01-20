"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import ParamOrderPicker from "@/components/ParamOrderPicker";
import { getRank } from "@/utils/produceRank";
import {
  calculateBonusParams,
  calculateGainedParams,
  calculateGainedVotes,
  calculateMaxScores,
  calculatePostAuditionParams,
  calculateVoteRating,
  getVoteRank,
  MAX_PARAMS,
  PARAM_REGIMES_BY_ORDER_BY_STAGE,
} from "@/utils/nia";
import ParamBadges from "./ParamBadges";
import Params from "./Params";
import styles from "./NiaCalculator.module.scss";

const STAGE_OPTIONS = [
  { value: "melobang", label: "メロBang!" },
  { value: "galaxy", label: "GALAXY" },
  { value: "finale", label: "FINALE" },
];

const AFFECTION_OPTIONS = [...new Array(11)].map((x, i) => ({
  value: i + 10,
  label: i + 10,
}));

export default function NiaCalculator() {
  const t = useTranslations("ProduceRankCalculator");

  const [stage, setStage] = useState("finale");
  const [paramOrder, setParamOrder] = useState([1, 2, 3]);
  const [params, setParams] = useState([null, null, null]);
  const [paramBonuses, setParamBonuses] = useState([null, null, null]);
  const [votes, setVotes] = useState(0);
  const [affection, setAffection] = useState(20);
  const [scores, setScores] = useState([null, null, null]);

  const maxScores = calculateMaxScores(stage, paramOrder, params, paramBonuses);

  const gainedParams = calculateGainedParams(stage, paramOrder, scores);
  const bonusParams = calculateBonusParams(gainedParams, paramBonuses);
  const postAuditionParams = calculatePostAuditionParams(
    params,
    gainedParams,
    bonusParams
  );
  const totalScore = scores.reduce((acc, cur) => acc + cur, 0);
  const gainedVotes = calculateGainedVotes(stage, affection, totalScore);
  const totalVotes = votes + gainedVotes;
  const voteRank = getVoteRank(totalVotes);

  const paramRating = Math.floor(
    postAuditionParams.reduce((acc, cur) => acc + cur, 0) * 2.3
  );

  let actualRating = "?";
  let actualRank = "?";
  if (voteRank) {
    const voteRating = calculateVoteRating(totalVotes, voteRank);
    actualRating = paramRating + voteRating;
    actualRank = getRank(actualRating);
  }

  return (
    <div className={styles.nia}>
      <section>
        <label>{t("affectionAtStartOfProduce")}</label>
        <ButtonGroup
          options={AFFECTION_OPTIONS}
          selected={affection}
          onChange={setAffection}
        />

        <label>{t("evaluationCriteria")}</label>
        <ParamOrderPicker initialOrder={paramOrder} onChange={setParamOrder} />

        <label>{t("paramBonusPct")}</label>
        <ParametersInput
          parameters={paramBonuses}
          max={MAX_PARAMS}
          onChange={setParamBonuses}
          round={false}
        />
      </section>

      <section>
        <label>{t("stage")}</label>
        <ButtonGroup
          options={STAGE_OPTIONS}
          selected={stage}
          onChange={setStage}
        />

        <label>{t("paramsPreAudition")}</label>
        <ParametersInput
          parameters={params}
          max={MAX_PARAMS}
          onChange={setParams}
        />

        <label>{t("votesPreAudition")}</label>
        <Input
          type="number"
          value={votes || ""}
          placeholder={t("voteCount")}
          onChange={setVotes}
          min={0}
          max={10000000}
        />
      </section>

      <section>
        <label>{t("paramHighGrowthScores")}</label>
        <Params
          params={paramOrder.map((order, i) =>
            Math.min(
              PARAM_REGIMES_BY_ORDER_BY_STAGE[stage][order][1].threshold,
              maxScores[i]
            )
          )}
        />
        <label>{t("paramMaximizingScores")}</label>
        <Params params={maxScores} />
        {/* <>TODO: Add target scores</> */}
        <label>{t("scores")}</label>
        <ParametersInput
          parameters={scores}
          max={10000000}
          onChange={setScores}
        />
        {!!totalScore && (
          <>
            <label>{t("gainedParams")}</label>
            <ParamBadges params={gainedParams} />

            <label>{t("bonusParams")}</label>
            <ParamBadges params={bonusParams} />

            <label>{t("paramsPostAudition")}</label>
            <Params params={postAuditionParams} />

            <label>{t("gainedVotes")}</label>
            <div>+{gainedVotes}</div>

            <label>{t("votesPostAudition")}</label>
            <div>
              {totalVotes}
              {voteRank ? ` (${voteRank})` : null}
            </div>

            <label>{t("produceRank")}</label>
            <span>
              {actualRating} {actualRank ? `(${actualRank})` : null}
            </span>
          </>
        )}
      </section>

      <span className={styles.note}>
        {t.rich("niaNote", {
          br: () => (
            <>
              <br />
              <br />
            </>
          ),
          link: (chunks) => (
            <a href="https://x.com/surisuririsu" target="_blank">
              {chunks}
            </a>
          ),
        })}
      </span>
    </div>
  );
}
