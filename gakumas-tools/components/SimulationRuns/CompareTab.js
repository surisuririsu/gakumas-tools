"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Stages } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import ConfirmModal from "@/components/ConfirmModal";
import ModalContext from "@/contexts/ModalContext";
import SimulationRunsContext from "@/contexts/SimulationRunsContext";
import { getIdolName, MAX_HISTORY } from "@/utils/simulationRun";
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

function stageKeyOf(run) {
  const id = run?.loadout?.stageId;
  if (id == null || id === "") return null;
  return String(id);
}

function stageLabelOf(run) {
  const id = run?.loadout?.stageId;
  if (id == null) return null;
  if (id === "custom") return "Custom";
  const s = Stages.getById(id);
  if (s?.season != null && s?.stage != null) {
    return `S${s.season}-${s.stage}`;
  }
  return run.derived?.stageName || String(id);
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
  const [stageFilter, setStageFilter] = useState("all");
  const [stageFilterTouched, setStageFilterTouched] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [idolFilter, setIdolFilter] = useState("all");

  // Default stage filter to current run's stage, until user changes it.
  useEffect(() => {
    if (stageFilterTouched) return;
    const key = stageKeyOf(currentRun);
    if (key) setStageFilter(key);
  }, [currentRun, stageFilterTouched]);

  const historyRuns = useMemo(() => {
    if (!currentRun) return history;
    return history.filter((r) => r.id !== currentRun.id);
  }, [history, currentRun]);

  const applyFilters = (runs) =>
    runs.filter((r) => {
      if (stageFilter !== "all") {
        if (stageKeyOf(r) !== stageFilter) return false;
      }
      if (seasonFilter !== "all") {
        if (String(r.derived?.season || "") !== seasonFilter) return false;
      }
      if (idolFilter !== "all") {
        if (String(r.derived?.idolId || "") !== idolFilter) return false;
      }
      return true;
    });

  const filteredHistory = useMemo(
    () => applyFilters(historyRuns),
    [historyRuns, stageFilter, seasonFilter, idolFilter],
  );
  const filteredSaved = useMemo(
    () => applyFilters(savedRuns),
    [savedRuns, stageFilter, seasonFilter, idolFilter],
  );

  const visibleRuns = subTab === "saved" ? filteredSaved : filteredHistory;

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

  const allPools = useMemo(
    () => [...history, ...savedRuns, ...(currentRun ? [currentRun] : [])],
    [history, savedRuns, currentRun],
  );

  const stageOptions = useMemo(() => {
    const map = new Map();
    for (const r of allPools) {
      const key = stageKeyOf(r);
      if (!key || map.has(key)) continue;
      map.set(key, stageLabelOf(r) || key);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allPools]);

  const seasonOptions = useMemo(() => {
    const seasons = new Set();
    for (const r of allPools) {
      if (r.derived?.season) seasons.add(r.derived.season);
    }
    return [...seasons].sort((a, b) => a - b);
  }, [allPools]);

  const idolOptions = useMemo(() => {
    const idols = new Map();
    for (const r of allPools) {
      const id = r.derived?.idolId;
      if (id && !idols.has(id)) {
        idols.set(id, getIdolName(id) || String(id));
      }
    }
    return [...idols.entries()];
  }, [allPools]);

  function promptSignIn() {
    setModal(
      <ConfirmModal
        message={t("signInPrompt")}
        onConfirm={() => signIn("discord")}
      />,
    );
  }

  async function handleSave(run, name) {
    if (status !== "authenticated") {
      promptSignIn();
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

  const filterCls = (v) =>
    `${styles.filter} ${v !== "all" ? styles.filterActive : ""}`;

  const showFifoNote = subTab === "history" && history.length > 0;

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
        <div className={styles.filters}>
          <select
            className={filterCls(stageFilter)}
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setStageFilterTouched(true);
            }}
          >
            <option value="all">{t("allStages")}</option>
            {stageOptions.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={filterCls(seasonFilter)}
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
            className={filterCls(idolFilter)}
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

      {showFifoNote && (
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
        <div className={styles.empty}>{t("signInToView")}</div>
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
