"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import IconSelect from "@/components/IconSelect";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import { getRank } from "@/utils/produceRank";
import styles from "./ProduceRankCalculator.module.scss";

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
  const [votes, setVotes] = useState(0);
  const [voteRank, setVoteRank] = useState("S");

  const paramRating = Math.floor(
    params.reduce((acc, cur) => acc + cur, 0) * 2.3
  );
  const { base, multiplier } = FAN_RATING_BY_VOTE_RANK[voteRank];
  const fanRating = base + Math.ceil(votes * multiplier);

  const actualRating = paramRating + fanRating;
  const actualRank = getRank(actualRating);

  return (
    <>
      <span>
        ※Functionality will be updated as we learn more about how parameter
        bonuses and fan bonuses are calculated.
      </span>
      <br />
      <label>{t("parametersPostAudition")}</label>
      <ParametersInput
        parameters={params}
        max={MAX_PARAMS}
        onChange={setParams}
      />

      <label>{t("votesPostAudition")}</label>
      <Input
        type="number"
        value={votes || ""}
        placeholder={t("voteCount")}
        onChange={setVotes}
        min={0}
        max={10000000}
      />

      <label>{t("voteCountRank")}</label>
      <div className={styles.rankSelect}>
        <IconSelect
          options={VOTE_RANK_OPTIONS}
          selected={voteRank}
          onChange={setVoteRank}
        />
      </div>

      {!!params.every((p) => !!p) && (
        <>
          <label>{t("produceRank")}</label>
          <span>
            {actualRating} {actualRank ? `(${actualRank})` : null}
          </span>
        </>
      )}
    </>
  );
}
