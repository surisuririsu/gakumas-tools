import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaPenToSquare,
  FaRegFloppyDisk,
  FaRegTrashCan,
  FaUpload,
  FaXmark,
} from "react-icons/fa6";
import { SkillCards, Stages } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import LoadoutSummary from "@/components/LoadoutHistory/LoadoutSummary";
import { FALLBACK_STAGE } from "@/simulator/constants";
import { formatRelative } from "@/utils/simulationRun";
import { formatStageName } from "@/utils/stages";
import ActionIconList from "./ActionIconList";
import ActionsCell from "./ActionsCell";
import MiniBoxPlot from "./MiniBoxPlot";
import styles from "./SimulationRuns.module.scss";

const LINK_PHASES = ["OP", "MID", "ED"];

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

  const [editMode, setEditMode] = useState(null);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const rowRef = useRef(null);

  useEffect(() => {
    if (editMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editMode]);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e) {
      if (rowRef.current && !rowRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [menuOpen]);

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
    const mode = editMode;
    cancelEdit();
    if (!trimmed) return;
    if (mode === "save" && onSave) {
      await onSave(run, trimmed);
    } else if (mode === "rename" && onRename) {
      await onRename(run, trimmed);
    }
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

  const closeMenuAfter = (fn) => () => {
    fn();
    setMenuOpen(false);
  };

  let items;
  if (editMode) {
    items = [
      { key: "confirm", icon: FaCheck, label: t("save"), onClick: confirmEdit },
      { key: "cancel", icon: FaXmark, label: t("cancel"), onClick: cancelEdit },
    ];
  } else {
    items = [];
    if (onLoad) {
      items.push({
        key: "load",
        icon: FaUpload,
        label: t("load"),
        onClick: closeMenuAfter(() => onLoad(run)),
      });
    }
    if (onRename && name) {
      items.push({
        key: "rename",
        icon: FaPenToSquare,
        label: t("edit"),
        onClick: closeMenuAfter(startRename),
      });
    }
    if (onSave) {
      items.push({
        key: "save",
        icon: FaRegFloppyDisk,
        label: t("save"),
        onClick: closeMenuAfter(startSave),
      });
    }
    if (onDelete) {
      items.push({
        key: "delete",
        icon: FaRegTrashCan,
        label: t("delete"),
        onClick: closeMenuAfter(() => onDelete(run)),
      });
    }
  }

  const relative = showTime && !editMode ? formatRelative(createdAt) : null;

  return (
    <Fragment>
    <div
      ref={rowRef}
      className={`${styles.row} ${current ? styles.rowCurrent : ""} ${
        menuOpen ? styles.rowMenuOpen : ""
      }`}
      data-run-id={run.id}
    >
      <div className={styles.expandCell}>
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? t("hideDetails") : t("showDetails")}
          aria-expanded={expanded}
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>

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
        <div className={styles.mobileActionsInline} aria-hidden={!menuOpen}>
          <ActionIconList items={items} />
        </div>
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
        items={items}
        menuOpen={menuOpen}
        onToggle={() => setMenuOpen((v) => !v)}
        editMode={!!editMode}
      />
    </div>
    {expanded && (
      <div className={styles.expandedDetails}>
        {run.linkLoadouts?.length ? (
          run.linkLoadouts.map((ld, i) => (
            <div key={i} className={styles.expandedLinkLoadout}>
              <div className={styles.expandedLinkLabel}>
                {LINK_PHASES[i] || `#${i + 1}`}
              </div>
              <LoadoutSummary loadout={ld} showStage={i === 0} />
            </div>
          ))
        ) : (
          <LoadoutSummary loadout={run.loadout} />
        )}
      </div>
    )}
    </Fragment>
  );
}

export default memo(CompareRow);
