"use client";
import React, { memo, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import Input from "@/components/Input";
import ParametersInput from "@/components/ParametersInput";
import { LESSONS_BY_DIFFICULTY } from "@/utils/lessons";
import styles from "./LessonCalculator.module.scss";

function LessonCalculator() {
  const t = useTranslations("LessonCalculator");

  const DIFFICULTY_OPTIONS = useMemo(
    () =>
      ["regular", "pro", "master"].map((difficulty) => ({
        value: difficulty,
        label: t(`difficulties.${difficulty}`),
      })),
    [t]
  );

  const [difficulty, setDifficulty] = useState("master");
  const [paramRates, setParamRates] = useState([null, null, null]);
  const [limitIncrease, setLimitIncrease] = useState(0);

  useEffect(() => {
    setLimitIncrease(0);
  }, [difficulty]);

  const lessons = LESSONS_BY_DIFFICULTY[difficulty];

  return (
    <div className={styles.lessonCalculator}>
      <label>{t("difficulty")}</label>
      <ButtonGroup
        options={DIFFICULTY_OPTIONS}
        selected={difficulty}
        onChange={setDifficulty}
      />

      <label>{t("lessonBonus")}</label>
      <ParametersInput
        parameters={paramRates}
        onChange={setParamRates}
        round={false}
      />

      {difficulty == "master" && (
        <>
          <label>{t("limitIncrease")}</label>
          <Input
            type="number"
            value={limitIncrease}
            onChange={setLimitIncrease}
            step={5}
            min={0}
          />
        </>
      )}

      <label>{t("lessons")}</label>
      <table className={styles.results}>
        <thead>
          <tr>
            <th style={{ width: "7%" }}>{t("week")}</th>
            <th style={{ width: "13%" }}>{t("type")}</th>
            <th style={{ width: "10%" }}>{t("score")}</th>
            <th colSpan={3} style={{ width: "20%" }}>
              Vo
            </th>
            <th colSpan={3} style={{ width: "20%" }}>
              Da
            </th>
            <th colSpan={3} style={{ width: "20%" }}>
              Vi
            </th>
          </tr>
        </thead>
        <tbody>
          {lessons.map(({ week, lessonTypes }) => (
            <React.Fragment key={week}>
              {lessonTypes.map(({ type, score, main, sub }, i) => (
                <tr key={type}>
                  {i == 0 && <td rowSpan={lessonTypes.length}>{week}</td>}
                  <td>{t(type)}</td>
                  <td className={styles.perfect}>
                    {score + (type == "oikomi" ? 0 : limitIncrease)}
                  </td>
                  {["vo", "da", "vi"].map((lessonParamType, i) => (
                    <React.Fragment key={lessonParamType}>
                      {type == "oikomi" ? (
                        ["vo", "da", "vi"].map((paramType, j) => (
                          <td key={paramType}>
                            {Math.floor(
                              (paramType == lessonParamType ? main : sub) *
                                (1 + paramRates[j] / 100)
                            )}
                          </td>
                        ))
                      ) : (
                        <td colSpan={3}>
                          {Math.floor(
                            (score + limitIncrease) * (1 + paramRates[i] / 100)
                          )}
                        </td>
                      )}
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(LessonCalculator);
