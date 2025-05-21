"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCircleChevronDown } from "react-icons/fa6";
import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import ButtonGroup from "@/components/ButtonGroup";
import IconSelect from "@/components/IconSelect";
import Input from "@/components/Input";
import LineChart from "@/components/LineChart";
import ParametersInput from "@/components/ParametersInput";
import Table from "@/components/Table";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { getRank, TARGET_RATING_BY_RANK } from "@/utils/produceRank";
import {
  BALANCE_BY_IDOL,
  calculateBonusParams,
  calculateChallengeParams,
  calculateGainedParams,
  calculateGainedVotes,
  calculatePostAuditionParams,
  calculateRecommendedScores,
  calculateVoteRating,
  getVoteRank,
  MAX_PARAMS_BY_DIFFICULTY,
  MIN_VOTES_BY_STAGE,
  PARAM_ORDER_BY_IDOL,
  PARAM_REGIMES_BY_DIFF_STAGE_BALANCE_ORDER,
  VOTE_REGIMES_BY_DIFF_STAGE,
} from "@/utils/nia";
import ParamBadges from "./ParamBadges";
import Params from "./Params";
import styles from "./NiaCalculator.module.scss";

const AFFECTION_OPTIONS = [...new Array(11)].map((x, i) => ({
  value: i + 10,
  label: i + 10,
}));

const IDOL_OPTIONS = Idols.getAll().map((idol) => ({
  id: idol.id,
  iconSrc: gkImg(idol).icon,
  alt: idol.name,
}));

const STAGE_OPTIONS_BY_DIFFICULTY = {
  pro: [
    { value: "melobang", label: "メロBang!" },
    { value: "galaxy", label: "GALAXY" },
    { value: "quartet", label: "QUARTET" },
    { value: "finale", label: "FINALE" },
  ],
  master: [{ value: "finale", label: "FINALE" }],
};

const FINAL_AUDITIONS = ["quartet", "finale"];

export default function NiaCalculator() {
  const t = useTranslations("ProduceRankCalculator");

  const DIFFICULTY_OPTIONS = useMemo(
    () =>
      ["pro", "master"].map((difficulty) => ({
        value: difficulty,
        label: t(`difficulties.${difficulty}`),
      })),
    [t]
  );
  const TABLE_HEADERS = [t("produceRank"), "Vo", "Da", "Vi"];

  const { idolId, setIdolId } = useContext(WorkspaceContext);

  const [difficulty, setDifficulty] = useState("master");
  const [stage, setStage] = useState("finale");
  const [params, setParams] = useState([null, null, null]);
  const [challengeParamBonus, setChallengeParamBonus] = useState(null);
  const [paramBonuses, setParamBonuses] = useState([null, null, null]);
  const [votes, setVotes] = useState(MIN_VOTES_BY_STAGE[stage]);
  const [affection, setAffection] = useState(20);
  const [scores, setScores] = useState([null, null, null]);

  let paramRegimesByOrder =
    PARAM_REGIMES_BY_DIFF_STAGE_BALANCE_ORDER[difficulty][stage];
  if (difficulty === "master") {
    const balance = BALANCE_BY_IDOL[idolId];
    paramRegimesByOrder = paramRegimesByOrder[balance];
  }
  const voteRegimes = VOTE_REGIMES_BY_DIFF_STAGE[difficulty][stage];

  useEffect(() => {
    if (votes < MIN_VOTES_BY_STAGE[stage]) {
      setVotes(MIN_VOTES_BY_STAGE[stage]);
    }
  }, [stage]);

  const maxParams = MAX_PARAMS_BY_DIFFICULTY[difficulty];
  const paramOrder = PARAM_ORDER_BY_IDOL[idolId];

  const recommendedScores = FINAL_AUDITIONS.includes(stage)
    ? calculateRecommendedScores(
        paramRegimesByOrder,
        voteRegimes,
        maxParams,
        paramOrder,
        challengeParamBonus,
        paramBonuses,
        affection,
        params,
        votes
      )
    : null;

  const gainedParams = calculateGainedParams(
    paramRegimesByOrder,
    paramOrder,
    scores
  );
  const challengeParams = calculateChallengeParams(
    gainedParams,
    challengeParamBonus
  );
  const bonusParams = calculateBonusParams(gainedParams, paramBonuses);
  const postAuditionParams = calculatePostAuditionParams(
    maxParams,
    params,
    gainedParams,
    challengeParams,
    bonusParams
  );
  const totalScore = scores.reduce((acc, cur) => acc + cur, 0);
  const gainedVotes = calculateGainedVotes(voteRegimes, affection, totalScore);
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
    <>
      <label>{t("difficulty")}</label>
      <ButtonGroup
        options={DIFFICULTY_OPTIONS}
        selected={difficulty}
        onChange={(diff) => {
          if (diff === "master") {
            setStage("finale");
            setAffection(20);
          } else {
            setChallengeParamBonus(null);
          }
          setDifficulty(diff);
        }}
      />
      <div className={styles.bonus}>
        {t("parameterLimit")}: {maxParams}
      </div>

      <div className={styles.nia}>
        <section>
          <label>{t("idol")}</label>
          <div className={styles.idolSelect}>
            <IconSelect
              options={IDOL_OPTIONS}
              selected={idolId}
              onChange={setIdolId}
            />
          </div>

          {difficulty === "pro" && (
            <>
              <label>{t("affectionAtStartOfProduce")}</label>
              <ButtonGroup
                options={AFFECTION_OPTIONS}
                selected={affection}
                onChange={setAffection}
              />
            </>
          )}

          <label>{t("paramBonusPct")}</label>
          <ParametersInput
            parameters={paramBonuses}
            max={maxParams}
            onChange={setParamBonuses}
            round={false}
          />

          {difficulty === "master" && (
            <>
              <label>{t("challengePItemsParamBonusPct")}</label>
              <Input
                type="number"
                value={challengeParamBonus || ""}
                placeholder="%"
                onChange={setChallengeParamBonus}
                min={0}
                max={40}
              />
            </>
          )}
        </section>

        <section>
          <label>{t("stage")}</label>
          <ButtonGroup
            options={STAGE_OPTIONS_BY_DIFFICULTY[difficulty]}
            selected={stage}
            onChange={setStage}
          />

          <label>{t("paramsPreAudition")}</label>
          <ParametersInput
            parameters={params}
            max={maxParams}
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

        {recommendedScores && (
          <section className={styles.recommendedScores}>
            <label>{t("recommendedScores")}</label>
            <Table
              headers={TABLE_HEADERS}
              rows={Object.keys(TARGET_RATING_BY_RANK)
                .slice(0, 8)
                .map((rank) => {
                  let row = [
                    recommendedScores[rank] ? (
                      <button
                        onClick={() => setScores(recommendedScores[rank])}
                      >
                        <FaCircleChevronDown />
                        <span className={styles.rankButtonLabel}>
                          {rank} ({TARGET_RATING_BY_RANK[rank]})
                        </span>
                      </button>
                    ) : (
                      `${rank} (${TARGET_RATING_BY_RANK[rank]})`
                    ),
                  ];
                  if (recommendedScores[rank]) {
                    return row.concat(recommendedScores[rank]);
                  } else {
                    return row.concat(["-", "-", "-"]);
                  }
                })}
            />
          </section>
        )}

        <section>
          {difficulty === "pro" && (
            <LineChart
              paramOrder={paramOrder}
              paramRegimes={paramRegimesByOrder}
              scores={scores}
              gainedParams={gainedParams}
            />
          )}

          <label>{t("scores")}</label>
          <ParametersInput
            parameters={scores}
            max={1000000000}
            onChange={setScores}
          />

          <label>{t("gainedParams")}</label>
          <ParamBadges params={gainedParams} />

          <label>{t("bonusParams")}</label>
          <ParamBadges params={bonusParams} />

          {difficulty === "master" && <ParamBadges params={challengeParams} />}

          <label>{t("paramsPostAudition")}</label>
          <Params params={postAuditionParams} />

          <div className={styles.flex}>
            <div>
              <label>{t("gainedVotes")}</label>
              <div>+{gainedVotes}</div>
            </div>

            <div>
              <label>{t("votesPostAudition")}</label>
              <div>
                {totalVotes}
                {voteRank ? ` (${voteRank})` : null}
              </div>
            </div>
          </div>

          <div className={styles.produceRank}>
            <label>{t("produceRank")}</label>
            <span>
              {actualRating} {actualRank ? `(${actualRank})` : null}
            </span>
          </div>
        </section>

        <span className={styles.note}>{t("niaNote")}</span>
      </div>
    </>
  );
}
