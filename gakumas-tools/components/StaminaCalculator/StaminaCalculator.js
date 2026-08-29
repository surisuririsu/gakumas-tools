"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaHeart } from "react-icons/fa6";
import {
  Idols,
  PIdols,
  getAvailableTrueEndScenarios,
  getMemoryStaminaBreakdown,
} from "gakumas-data";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import Modal from "@/components/Modal";
import TabGroup from "@/components/TabGroup";
import { getLoadoutStaminaContributions } from "@/utils/stamina";
import styles from "./StaminaCalculator.module.scss";

const TRUE_END_SCENARIOS = ["hajime", "nia", "hif"];

const TRAINING_RANKS = Array.from({ length: 8 }, (_, value) => ({
  value,
  label: value,
}));
const AWAKENING_RANKS = Array.from({ length: 5 }, (_, value) => ({
  value,
  label: value,
}));
// Affection only changes memory stamina at levels 22 and 25. Grouping the
// no-op levels avoids a long picker while still representing every result.
const AFFECTION_RANGES = [
  { value: 0, label: "0–21" },
  { value: 22, label: "22–24" },
  { value: 37, label: "25–37" },
];
const SENSEI_LEVELS = [
  { value: 0, min: 0, max: 0, stamina: 0 },
  { value: 1, min: 1, max: 24, stamina: 4 },
  { value: 25, min: 25, max: 39, stamina: 5 },
  { value: 40, min: 40, max: 44, stamina: 6 },
  { value: 45, min: 45, max: 49, stamina: 7 },
  { value: 50, min: 50, max: 54, stamina: 8 },
  { value: 60, min: 55, max: 60, stamina: 9 },
];

function getDefaultSettings(pIdol) {
  return {
    trainingRank: 7,
    awakeningRank: 4,
    affectionLevel: 37,
    trueEndScenarios: getAvailableTrueEndScenarios(pIdol),
    senseiLevels: [60, 0],
  };
}

function MemoryStaminaFields({ memory, settings, breakdown, onChange }) {
  const t = useTranslations("StaminaCalculator");
  const { pIdol, index, multiplier } = memory;

  if (!pIdol) {
    return (
      <section className={styles.memory}>
        <div className={styles.memoryHeading}>
          <h4>{t("memory", { number: index + 1 })}</h4>
        </div>
        <p className={styles.help}>{t("missingPIdol")}</p>
      </section>
    );
  }

  const idol = Idols.getById(pIdol.idolId);
  const availableTrueEndScenarios = getAvailableTrueEndScenarios(pIdol);

  function setSenseiLevel(index, level) {
    const next = [...settings.senseiLevels];
    next[index] = level || 0;
    onChange("senseiLevels", next);
  }

  function toggleTrueEndScenario(scenario) {
    onChange(
      "trueEndScenarios",
      settings.trueEndScenarios.includes(scenario)
        ? settings.trueEndScenarios.filter((value) => value !== scenario)
        : [...settings.trueEndScenarios, scenario],
    );
  }

  return (
    <section className={styles.memory}>
      <div className={styles.memoryHeading}>
        <div>
          <h4>{t("memory", { number: index + 1 })}</h4>
          <p className={styles.pIdol}>
            {idol?.name} — {pIdol.title}
          </p>
        </div>
        {breakdown && (
          <strong>
            {t("contribution", {
              percent: Math.round(multiplier * 100),
              stamina: Math.floor(breakdown.total * multiplier),
            })}
          </strong>
        )}
      </div>

      {breakdown ? (
        <>
          <div className={styles.fields}>
            <section className={styles.field}>
              <div className={styles.fieldLabel}>{t("trainingRank")}</div>
              <ButtonGroup
                selected={settings.trainingRank}
                options={TRAINING_RANKS}
                onChange={(value) => onChange("trainingRank", value)}
              />
            </section>

            <section className={styles.field}>
              <div className={styles.fieldLabel}>{t("awakeningRank")}</div>
              <ButtonGroup
                selected={settings.awakeningRank}
                options={AWAKENING_RANKS}
                onChange={(value) => onChange("awakeningRank", value)}
              />
            </section>

            <section className={styles.field}>
              <div className={styles.fieldLabel}>{t("affectionLevel")}</div>
              <ButtonGroup
                selected={settings.affectionLevel}
                options={AFFECTION_RANGES}
                onChange={(value) => onChange("affectionLevel", value)}
              />
            </section>

            <section className={styles.field}>
              <div className={styles.fieldLabel}>
                {t("trueEndAchievements")}
              </div>
              <div
                className={styles.trueEnds}
                role="group"
                aria-label={t("trueEndAchievements")}
              >
                {TRUE_END_SCENARIOS.map((scenario) => {
                  const confirmed =
                    availableTrueEndScenarios.includes(scenario);
                  const selected =
                    settings.trueEndScenarios.includes(scenario);
                  return (
                    <label key={scenario} className={styles.trueEnd}>
                      <input
                        type="checkbox"
                        disabled={!confirmed}
                        checked={selected}
                        onChange={() => toggleTrueEndScenario(scenario)}
                      />
                      <span>{t(`scenarios.${scenario}`)}</span>
                    </label>
                  );
                })}
              </div>
              <p className={styles.help}>{t("trueEndHelp")}</p>
            </section>

            <section className={styles.field}>
              <div className={styles.fieldLabel}>{t("senseiCards")}</div>
              <div className={styles.senseiCards}>
                {settings.senseiLevels.map((level, index) => (
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

          <details className={styles.breakdown}>
            <summary>{t("showBreakdown")}</summary>
            <dl>
              {[
                "base",
                "training",
                "awakening",
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
        </>
      ) : (
        <p className={styles.help}>{t("unavailable")}</p>
      )}
    </section>
  );
}

function StaminaCalculatorModal({ memories, onApply, onClose }) {
  const t = useTranslations("StaminaCalculator");
  const [activeMemory, setActiveMemory] = useState(0);
  const [settings, setSettings] = useState(() =>
    memories.map(({ pIdol }) => getDefaultSettings(pIdol)),
  );

  const breakdowns = useMemo(
    () =>
      memories.map(({ pIdol }, index) =>
        getMemoryStaminaBreakdown({ pIdol, ...settings[index] }),
      ),
    [memories, settings],
  );
  const contributions = getLoadoutStaminaContributions(
    breakdowns.map((breakdown) => breakdown?.total),
    memories.map(({ multiplier }) => multiplier),
  );
  const total = contributions.some((value) => value == null)
    ? null
    : contributions.reduce((sum, value) => sum + value, 0);

  function updateSettings(index, key, value) {
    setSettings((current) => {
      const next = [...current];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }

  return (
    <Modal onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.heading}>
          <h3>{t("title")}</h3>
        </div>
        <p className={styles.intro}>{t("defaultsHelp")}</p>

        {memories.length > 1 && (
          <TabGroup
            className={styles.memoryTabs}
            selected={activeMemory}
            options={memories.map((memory, index) => ({
              value: index,
              label: t("memory", { number: memory.index + 1 }),
            }))}
            onChange={setActiveMemory}
          />
        )}

        {memories.map(
          (memory, index) =>
            index === activeMemory && (
              <MemoryStaminaFields
                key={memory.index}
                memory={memory}
                settings={settings[index]}
                breakdown={breakdowns[index]}
                onChange={(key, value) => updateSettings(index, key, value)}
              />
            ),
        )}

        {total != null && (
          <>
            <div className={styles.result}>
              <span>{t("total")}</span>
              <strong>{total}</strong>
            </div>
            <Button
              style="primary"
              fill
              onClick={() => {
                onApply(total);
                onClose();
              }}
            >
              {t("apply", { stamina: total })}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function StaminaCalculator({ memorySlots, onApply }) {
  const t = useTranslations("StaminaCalculator");
  const [open, setOpen] = useState(false);
  const memories = memorySlots.map((slot) => ({
    ...slot,
    pIdol: PIdols.getById(slot.pIdolId),
  }));
  const hasPIdol = memories.some(({ pIdol }) => pIdol);

  return (
    <>
      <button
        type="button"
        className={styles.open}
        disabled={!hasPIdol}
        title={hasPIdol ? t("open") : t("selectPIdol")}
        aria-label={hasPIdol ? t("open") : t("selectPIdol")}
        onClick={() => setOpen(true)}
      >
        <FaHeart />
      </button>
      {open && hasPIdol && (
        <StaminaCalculatorModal
          memories={memories}
          onApply={onApply}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
