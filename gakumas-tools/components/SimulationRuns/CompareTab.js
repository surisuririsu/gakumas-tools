"use client";
import { useContext, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import ConfirmModal from "@/components/ConfirmModal";
import ModalContext from "@/contexts/ModalContext";
import SimulationRunsContext, {
  MAX_HISTORY,
} from "@/contexts/SimulationRunsContext";
import { getIdolName } from "@/utils/simulationRun";
import AxisRow from "./AxisRow";
import CompareRow from "./CompareRow";
import styles from "./SimulationRuns.module.scss";

const PAD_RATIO = 0.05;
const TARGET_TICKS = 5;

function computeRange(runs) {
  let min = Infinity;
  let max = -Infinity;
  for (const run of runs) {
    if (!run?.stats) continue;
    if (run.stats.min < min) min = run.stats.min;
    if (run.stats.max > max) max = run.stats.max;
  }
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  const span = max - min;
  const pad = span * PAD_RATIO;
  return { min: min - pad, max: max + pad };
}

function computeTicks(min, max) {
  const range = max - min;
  if (range <= 0) return [];
  const rawStep = range / TARGET_TICKS;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep;
  if (normalized < 1.5) niceStep = magnitude;
  else if (normalized < 3) niceStep = 2 * magnitude;
  else if (normalized < 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  const start = Math.ceil(min / niceStep) * niceStep;
  const ticks = [];
  for (let v = start; v <= max; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}

export default function CompareTab({ currentRun }) {
  const t = useTranslations("CompareTab");
  const { status } = useSession();
  const { setModal } = useContext(ModalContext);
  const {
    history,
    savedRuns,
    savedLoading,
    saveRun,
    deleteHistoryRun,
    deleteSaved,
    renameSaved,
    loadRun,
  } = useContext(SimulationRunsContext);

  const [subTab, setSubTab] = useState("history");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [idolFilter, setIdolFilter] = useState("all");

  const historyRuns = useMemo(() => {
    if (!currentRun) return history;
    return history.filter((r) => r.id !== currentRun.id);
  }, [history, currentRun]);

  const filteredSaved = useMemo(() => {
    return savedRuns.filter((r) => {
      if (seasonFilter !== "all") {
        if (String(r.derived?.season || "") !== seasonFilter) return false;
      }
      if (idolFilter !== "all") {
        if (String(r.derived?.idolId || "") !== idolFilter) return false;
      }
      return true;
    });
  }, [savedRuns, seasonFilter, idolFilter]);

  const visibleRuns = subTab === "saved" ? filteredSaved : historyRuns;

  const range = useMemo(() => {
    const all = [];
    if (currentRun) all.push(currentRun);
    for (const r of visibleRuns) all.push(r);
    return computeRange(all);
  }, [currentRun, visibleRuns]);

  const ticks = useMemo(
    () => computeTicks(range.min, range.max),
    [range],
  );

  const seasonOptions = useMemo(() => {
    const seasons = new Set();
    for (const r of savedRuns) {
      if (r.derived?.season) seasons.add(r.derived.season);
    }
    return [...seasons].sort((a, b) => a - b);
  }, [savedRuns]);

  const idolOptions = useMemo(() => {
    const idols = new Map();
    for (const r of savedRuns) {
      const id = r.derived?.idolId;
      if (id && !idols.has(id)) {
        idols.set(id, getIdolName(id) || String(id));
      }
    }
    return [...idols.entries()];
  }, [savedRuns]);

  async function handleSave(run, name) {
    if (status !== "authenticated") {
      signIn("discord");
      return;
    }
    await saveRun(run, name);
  }

  async function handleRename(run, name) {
    await renameSaved(run._id || run.id, name);
  }

  function confirmDelete(onConfirm) {
    setModal(
      <ConfirmModal message={t("confirmDelete")} onConfirm={onConfirm} />,
    );
  }

  function handleDeleteHistory(run) {
    confirmDelete(() => deleteHistoryRun(run.id));
  }

  function handleDeleteSaved(run) {
    confirmDelete(() => deleteSaved([run._id || run.id]));
  }

  return (
    <div className={styles.compare}>
      <div className={styles.subTabs}>
        <ButtonGroup
          selected={subTab}
          options={[
            { value: "history", label: t("history") },
            { value: "saved", label: t("saved") },
          ]}
          onChange={setSubTab}
        />
        {subTab === "saved" && (
          <div className={styles.filters}>
            <select
              className={styles.filter}
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
            >
              <option value="all">{t("allSeasons")}</option>
              {seasonOptions.map((s) => (
                <option key={s} value={String(s)}>
                  {t("season")} {s}
                </option>
              ))}
            </select>
            <select
              className={styles.filter}
              value={idolFilter}
              onChange={(e) => setIdolFilter(e.target.value)}
            >
              <option value="all">{t("allIdols")}</option>
              {idolOptions.map(([id, name]) => (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {(currentRun || visibleRuns.length > 0) && (
        <AxisRow ticks={ticks} xMin={range.min} xMax={range.max} />
      )}

      {currentRun && (
        <CompareRow
          run={currentRun}
          xMin={range.min}
          xMax={range.max}
          ticks={ticks}
          current
          onSave={handleSave}
        />
      )}

      {subTab === "history" && historyRuns.length + (currentRun ? 1 : 0) > 0 && (
        <div
          className={`${styles.fifoNote} ${
            history.length >= MAX_HISTORY ? styles.fifoNoteWarn : ""
          }`}
        >
          {history.length >= MAX_HISTORY
            ? t("fifoAtLimit", { max: MAX_HISTORY })
            : t("fifoHint", { count: history.length, max: MAX_HISTORY })}
        </div>
      )}

      {subTab === "saved" && status === "unauthenticated" ? (
        <div className={styles.empty}>
          <Button style="primary" onClick={() => signIn("discord")}>
            {t("signInToSave")}
          </Button>
        </div>
      ) : subTab === "saved" &&
        (status === "loading" || savedLoading) ? (
        <div className={styles.empty}>{t("loading")}</div>
      ) : visibleRuns.length === 0 ? (
        <div className={styles.empty}>
          {subTab === "saved" ? t("emptySaved") : t("emptyHistory")}
        </div>
      ) : (
        visibleRuns.map((run) => (
          <CompareRow
            key={run.id}
            run={run}
            xMin={range.min}
            xMax={range.max}
            ticks={ticks}
            showTime={subTab === "history"}
            onLoad={loadRun}
            onSave={subTab === "history" ? handleSave : undefined}
            onRename={subTab === "saved" ? handleRename : undefined}
            onDelete={
              subTab === "saved" ? handleDeleteSaved : handleDeleteHistory
            }
          />
        ))
      )}
    </div>
  );
}
