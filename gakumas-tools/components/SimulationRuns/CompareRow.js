import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SkillCards, Stages } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { formatStageName } from "@/utils/stages";
import ActionsCell from "./ActionsCell";
import MiniBoxPlot from "./MiniBoxPlot";
import styles from "./SimulationRuns.module.scss";

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function formatRelative(iso) {
  if (!iso) return null;
  const ts = new Date(iso).getTime();
  if (!isFinite(ts)) return null;
  const diff = Date.now() - ts;
  if (diff < MIN) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  return `${Math.floor(diff / DAY)}d ago`;
}

function CompareRow({
  run,
  xMin,
  xMax,
  ticks,
  current,
  showTime,
  onLoad,
  onSave,
  onRename,
  onDelete,
}) {
  const t = useTranslations("CompareTab");
  const tStage = useTranslations("StageSummary");

  const { loadout, derived, stats, name, createdAt } = run;

  const [editMode, setEditMode] = useState(null); // "save" | "rename" | null
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editMode]);

  const stage = useMemo(() => {
    if (loadout.stageId === "custom") {
      return loadout.customStage || FALLBACK_STAGE;
    }
    if (loadout.stageId) {
      return Stages.getById(loadout.stageId) || FALLBACK_STAGE;
    }
    return FALLBACK_STAGE;
  }, [loadout]);

  const signatureCard = derived?.signatureCardId
    ? SkillCards.getById(derived.signatureCardId)
    : null;

  function startSave() {
    setDraft(name || derived?.stageName || "");
    setEditMode("save");
  }

  function startRename() {
    setDraft(name || "");
    setEditMode("rename");
  }

  function cancelEdit() {
    setEditMode(null);
    setDraft("");
  }

  async function confirmEdit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    if (editMode === "save" && onSave) {
      await onSave(run, trimmed);
    } else if (editMode === "rename" && onRename) {
      await onRename(run, trimmed);
    }
    cancelEdit();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  const relative = showTime && !editMode ? formatRelative(createdAt) : null;

  return (
    <div
      className={`${styles.row} ${current ? styles.rowCurrent : ""}`}
      data-run-id={run.id}
    >
      <div className={styles.cardCell}>
        {signatureCard ? (
          <Image
            src={gkImg(signatureCard).icon}
            width={36}
            height={36}
            alt={signatureCard.name}
            draggable={false}
          />
        ) : (
          <div className={styles.cardPlaceholder} />
        )}
      </div>

      <div className={styles.stageCell}>
        <div className={styles.tagRow}>
          {current && <span className={styles.tag}>{t("current")}</span>}
          {relative && <span className={styles.time}>{relative}</span>}
        </div>
        {editMode ? (
          <div className={styles.runNameRow}>
            <input
              ref={inputRef}
              className={styles.nameInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("savePrompt")}
            />
          </div>
        ) : name ? (
          <div
            className={onRename ? styles.runNameEditable : styles.runName}
            onClick={onRename ? startRename : undefined}
            title={onRename ? t("edit") : undefined}
          >
            {name}
          </div>
        ) : null}
        <div className={styles.stageName}>
          {formatStageName(stage, tStage)}
        </div>
      </div>

      <div className={styles.plotCell}>
        {stats ? (
          <MiniBoxPlot
            stats={stats}
            xMin={xMin}
            xMax={xMax}
            ticks={ticks}
            highlight={current}
          />
        ) : (
          <div className={styles.noScores}>{t("noScores")}</div>
        )}
      </div>

      <div className={styles.numbersCell}>
        {stats ? (
          <>
            <div>
              <span className={styles.label}>{t("mean")}</span>{" "}
              {Math.round(stats.mean).toLocaleString()}
            </div>
            <div>
              <span className={styles.label}>{t("median")}</span>{" "}
              {Math.round(stats.median).toLocaleString()}
            </div>
          </>
        ) : (
          <div>—</div>
        )}
      </div>

      <ActionsCell
        editMode={editMode}
        onConfirm={confirmEdit}
        onCancel={cancelEdit}
        onLoad={onLoad ? () => onLoad(run) : undefined}
        onSave={onSave ? startSave : undefined}
        onRename={onRename ? startRename : undefined}
        onDelete={onDelete ? () => onDelete(run) : undefined}
        canRename={!!name}
        t={t}
      />
    </div>
  );
}

export default memo(CompareRow);
