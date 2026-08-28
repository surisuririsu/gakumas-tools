"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaChalkboardUser,
  FaDumbbell,
  FaHeart,
  FaStar,
  FaTrophy,
} from "react-icons/fa6";
import {
  Idols,
  PIdols,
  getMemoryStaminaBreakdown,
} from "gakumas-data";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import c from "@/utils/classNames";
import styles from "./StaminaCalculator.module.scss";

const TRUE_END_SCENARIOS = [
  "firstStar",
  "nextIdolAudition",
  "hatsuboshiIdolFestival",
];

const TRUE_END_FIELDS = {
  firstStar: "trueEndStaminaFirstStar",
  nextIdolAudition: "trueEndStaminaNextIdolAudition",
  hatsuboshiIdolFestival: "trueEndStaminaHatsuboshiIdolFestival",
};

const TRAINING_RANKS = Array.from({ length: 8 }, (_, rank) => rank);
const POTENTIAL_RANKS = Array.from({ length: 5 }, (_, rank) => rank);
const SENSEI_LEVELS = [
  { value: 0, min: 0, max: 0, stamina: 0 },
  { value: 1, min: 1, max: 24, stamina: 4 },
  { value: 25, min: 25, max: 39, stamina: 5 },
  { value: 40, min: 40, max: 44, stamina: 6 },
  { value: 45, min: 45, max: 49, stamina: 7 },
  { value: 50, min: 50, max: 54, stamina: 8 },
  { value: 60, min: 55, max: 60, stamina: 9 },
];

function ChoiceButtons({ label, value, values, onChange }) {
  return (
    <div className={styles.choices} role="group" aria-label={label}>
      {values.map((option) => (
        <button
          type="button"
          key={option}
          className={c(option === value && styles.selected)}
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ icon, children, value }) {
  return (
    <div className={styles.fieldLabel}>
      <span className={styles.fieldLabelText}>
        {icon}
        <span>{children}</span>
      </span>
      {value != null && <strong>{value}</strong>}
    </div>
  );
}

function StaminaCalculatorModal({ pIdol, onApply, onClose }) {
  const t = useTranslations("StaminaCalculator");
  const idol = Idols.getById(pIdol.idolId);
  const confirmedTrueEndScenarios = TRUE_END_SCENARIOS.filter((scenario) =>
    Number.isInteger(idol?.[TRUE_END_FIELDS[scenario]]),
  );
  const [trainingRank, setTrainingRank] = useState(7);
  const [potentialRank, setPotentialRank] = useState(4);
  const [affectionLevel, setAffectionLevel] = useState(37);
  const [trueEndScenarios, setTrueEndScenarios] = useState(
    confirmedTrueEndScenarios,
  );
  const [senseiLevels, setSenseiLevels] = useState([60, 0]);

  const breakdown = useMemo(
    () =>
      getMemoryStaminaBreakdown({
        pIdol,
        idol,
        trainingRank,
        potentialRank,
        affectionLevel,
        trueEndScenarios,
        senseiLevels,
      }),
    [
      pIdol,
      idol,
      trainingRank,
      potentialRank,
      affectionLevel,
      trueEndScenarios,
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

  function toggleTrueEndScenario(scenario) {
    setTrueEndScenarios((current) =>
      current.includes(scenario)
        ? current.filter((value) => value !== scenario)
        : [...current, scenario],
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.heading}>
          <h3>{t("title")}</h3>
          <p className={styles.pIdol}>
            {idol?.name} — {pIdol.title}
          </p>
        </div>

        {breakdown ? (
          <>
            <p className={styles.intro}>{t("defaultsHelp")}</p>

            <div className={styles.fields}>
              <section className={styles.field}>
                <FieldLabel icon={<FaDumbbell />}>
                  {t("trainingRank")}
                </FieldLabel>
                <ChoiceButtons
                  label={t("trainingRank")}
                  value={trainingRank}
                  values={TRAINING_RANKS}
                  onChange={setTrainingRank}
                />
              </section>

              <section className={styles.field}>
                <FieldLabel icon={<FaStar />}>
                  {t("potentialRank")}
                </FieldLabel>
                <ChoiceButtons
                  label={t("potentialRank")}
                  value={potentialRank}
                  values={POTENTIAL_RANKS}
                  onChange={setPotentialRank}
                />
              </section>

              <section className={styles.field}>
                <FieldLabel icon={<FaHeart />} value={affectionLevel}>
                  {t("affectionLevel")}
                </FieldLabel>
                <input
                  className={styles.range}
                  type="range"
                  aria-label={t("affectionLevel")}
                  min={0}
                  max={37}
                  value={affectionLevel}
                  onChange={(event) =>
                    setAffectionLevel(Number(event.target.value))
                  }
                />
              </section>

              <section className={styles.field}>
                <FieldLabel icon={<FaTrophy />}>
                  {t("trueEndAchievements")}
                </FieldLabel>
                <div
                  className={styles.trueEnds}
                  role="group"
                  aria-label={t("trueEndAchievements")}
                >
                  {TRUE_END_SCENARIOS.map((scenario) => {
                    const confirmed =
                      confirmedTrueEndScenarios.includes(scenario);
                    const selected = trueEndScenarios.includes(scenario);
                    return (
                      <button
                        type="button"
                        key={scenario}
                        disabled={!confirmed}
                        className={c(selected && styles.selected)}
                        aria-pressed={selected}
                        onClick={() => toggleTrueEndScenario(scenario)}
                      >
                        {t(`scenarios.${scenario}`)}
                      </button>
                    );
                  })}
                </div>
                <p className={styles.help}>{t("trueEndHelp")}</p>
              </section>

              <section className={styles.field}>
                <FieldLabel icon={<FaChalkboardUser />}>
                  {t("senseiCards")}
                </FieldLabel>
                <div className={styles.senseiCards}>
                  {senseiLevels.map((level, index) => (
                    <label key={index}>
                      <span>{t("senseiCard", { number: index + 1 })}</span>
                      <select
                        value={level}
                        onChange={(event) =>
                          setSenseiLevel(index, Number(event.target.value))
                        }
                      >
                        {SENSEI_LEVELS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value === 0
                              ? t("notUsed")
                              : t("senseiLevelRange", option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p className={styles.help}>{t("senseiHelp")}</p>
              </section>
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
        <FaHeart />
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
