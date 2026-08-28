"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCalculator } from "react-icons/fa6";
import {
  Idols,
  PIdols,
  getMemoryStaminaBreakdown,
} from "gakumas-data";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import styles from "./StaminaCalculator.module.scss";

const TRUE_END_SCENARIOS = [
  "firstStar",
  "nextIdolAudition",
  "hatsuboshiIdolFestival",
];

function maxMilestone(bonuses) {
  return bonuses?.reduce(
    (max, milestone) => Math.max(max, milestone.rank),
    0,
  );
}

function StaminaCalculatorModal({ pIdol, onApply, onClose }) {
  const t = useTranslations("StaminaCalculator");
  const idol = Idols.getById(pIdol.idolId);
  const [trainingRank, setTrainingRank] = useState(
    maxMilestone(pIdol.trainingStaminaBonuses),
  );
  const [potentialRank, setPotentialRank] = useState(
    maxMilestone(pIdol.potentialStaminaBonuses),
  );
  const [affectionLevel, setAffectionLevel] = useState(
    maxMilestone(idol?.affectionStaminaBonuses),
  );
  const [trueEndScenario, setTrueEndScenario] = useState("");
  const [senseiLevels, setSenseiLevels] = useState([0, 0]);

  const breakdown = useMemo(
    () =>
      getMemoryStaminaBreakdown({
        pIdol,
        idol,
        trainingRank,
        potentialRank,
        affectionLevel,
        trueEndScenario: trueEndScenario || null,
        senseiLevels,
      }),
    [
      pIdol,
      idol,
      trainingRank,
      potentialRank,
      affectionLevel,
      trueEndScenario,
      senseiLevels,
    ],
  );

  function setSenseiLevel(index, level) {
    setSenseiLevels((current) => {
      const next = [...current];
      next[index] = level || 0;
      return next;
    });
  }

  return (
    <Modal onClose={onClose}>
      <div className={styles.modal}>
        <div>
          <h3>{t("title")}</h3>
          <p className={styles.pIdol}>
            {idol?.name} — {pIdol.title}
          </p>
        </div>

        {breakdown ? (
          <>
            <div className={styles.fields}>
              <label>
                <span>{t("trainingRank")}</span>
                <Input
                  type="number"
                  round
                  min={0}
                  max={10}
                  value={trainingRank}
                  onChange={(value) => setTrainingRank(value || 0)}
                />
              </label>
              <label>
                <span>{t("potentialRank")}</span>
                <Input
                  type="number"
                  round
                  min={0}
                  max={10}
                  value={potentialRank}
                  onChange={(value) => setPotentialRank(value || 0)}
                />
              </label>
              <label>
                <span>{t("affectionLevel")}</span>
                <Input
                  type="number"
                  round
                  min={0}
                  max={100}
                  value={affectionLevel}
                  onChange={(value) => setAffectionLevel(value || 0)}
                />
              </label>
              <label>
                <span>{t("trueEndScenario")}</span>
                <select
                  value={trueEndScenario}
                  onChange={(event) => setTrueEndScenario(event.target.value)}
                >
                  <option value="">{t("none")}</option>
                  {TRUE_END_SCENARIOS.map((scenario) => (
                    <option key={scenario} value={scenario}>
                      {t(`scenarios.${scenario}`)}
                    </option>
                  ))}
                </select>
              </label>
              {senseiLevels.map((level, index) => (
                <label key={index}>
                  <span>{t("senseiLevel", { number: index + 1 })}</span>
                  <Input
                    type="number"
                    round
                    min={0}
                    max={60}
                    value={level}
                    onChange={(value) => setSenseiLevel(index, value)}
                  />
                </label>
              ))}
            </div>

            <div className={styles.result}>
              <span>{t("total")}</span>
              <strong>{breakdown.total}</strong>
            </div>

            <details className={styles.breakdown}>
              <summary>{t("showBreakdown")}</summary>
              <dl>
                {[
                  "base",
                  "training",
                  "potential",
                  "affection",
                  "trueEnd",
                  "sensei",
                ].map((key) => (
                  <div key={key}>
                    <dt>{t(`breakdown.${key}`)}</dt>
                    <dd>{breakdown[key]}</dd>
                  </div>
                ))}
              </dl>
            </details>

            <Button
              style="primary"
              fill
              onClick={() => {
                onApply(breakdown.total);
                onClose();
              }}
            >
              {t("apply", { stamina: breakdown.total })}
            </Button>
          </>
        ) : (
          <p>{t("unavailable")}</p>
        )}
      </div>
    </Modal>
  );
}

export default function StaminaCalculator({ pIdolId, onApply }) {
  const t = useTranslations("StaminaCalculator");
  const [open, setOpen] = useState(false);
  const pIdol = PIdols.getById(pIdolId);

  return (
    <>
      <button
        type="button"
        className={styles.open}
        disabled={!pIdol}
        title={pIdol ? t("open") : t("selectPIdol")}
        aria-label={pIdol ? t("open") : t("selectPIdol")}
        onClick={() => setOpen(true)}
      >
        <FaCalculator />
      </button>
      {open && pIdol && (
        <StaminaCalculatorModal
          pIdol={pIdol}
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
