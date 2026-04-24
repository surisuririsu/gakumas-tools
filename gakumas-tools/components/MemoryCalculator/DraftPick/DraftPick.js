import { memo, useContext, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FaChevronDown, FaChevronUp, FaFileImport } from "react-icons/fa6";
import Button from "@/components/Button";
import EntityIcon from "@/components/EntityIcon";
import EntityPickerModal from "@/components/EntityPickerModal";
import Panel from "@/components/Panel";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import ModalContext from "@/contexts/ModalContext";
import c from "@/utils/classNames";
import { EntityTypes } from "@/utils/entities";
import {
  classifyMemories,
  generatePossibleMemories,
} from "@/utils/skillCardLottery";
import { PRODUCE_ONLY_FILTER } from "../skillCardFilters";
import styles from "./DraftPick.module.scss";

const DraftPickImporterModal = dynamic(
  () => import("@/components/DraftPickImporterModal"),
  { ssr: false }
);

const EMPTY_SLOTS = [0, 0, 0];
const FILTERS = [PRODUCE_ONLY_FILTER];

function DraftPick({ idolId }) {
  const t = useTranslations("DraftPick");
  const {
    acquiredSkillCardIds,
    setAcquiredSkillCardIds,
    rank,
    targetSkillCardIds,
    alternateSkillCardIds,
    targetNegations,
  } = useContext(MemoryCalculatorContext);
  const { setModal, closeModal } = useContext(ModalContext);
  const [open, setOpen] = useState(false);
  const [candidateCardIds, setCandidateCardIds] = useState(EMPTY_SLOTS);

  const openImporter = () =>
    setModal(
      <DraftPickImporterModal
        onSuccess={(ids) => {
          setCandidateCardIds(EMPTY_SLOTS.map((_, i) => ids[i] || 0));
          closeModal();
        }}
      />,
    );

  const replaceCandidate = (index, id) => {
    setCandidateCardIds((cur) => {
      const next = [...cur];
      next[index] = id;
      return next;
    });
  };

  const clear = () => setCandidateCardIds(EMPTY_SLOTS);

  const commit = (index) => {
    const id = candidateCardIds[index];
    if (!id) return;
    setAcquiredSkillCardIds((cur) => [...cur, id]);
    clear();
  };

  const probabilities = useMemo(() => {
    return candidateCardIds.map((id) => {
      if (!id) return null;
      const memories = generatePossibleMemories(
        [...acquiredSkillCardIds, id],
        rank,
      );
      const { onTargetProbability } = classifyMemories(memories, {
        targetSkillCardIds,
        alternateSkillCardIds,
        targetNegations,
      });
      return onTargetProbability;
    });
  }, [
    candidateCardIds,
    acquiredSkillCardIds,
    rank,
    targetSkillCardIds,
    alternateSkillCardIds,
    targetNegations,
  ]);

  const best = Math.max(-Infinity, ...probabilities.filter((p) => p != null));
  const hasAnyCandidate = candidateCardIds.some((id) => id);

  return (
    <Panel
      label={t("label")}
      info={t("info")}
      headerAction={
        <div className={styles.headerActions}>
          {open && (
            <Button style="secondary" size="sm" pill onClick={openImporter}>
              <FaFileImport />
              {t("import")}
            </Button>
          )}
          {open && hasAnyCandidate && (
            <Button style="red-secondary" size="sm" pill onClick={clear}>
              {t("clear")}
            </Button>
          )}
          <Button
            style={open ? "secondary" : "default"}
            size="sm"
            pill
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t("hide") : t("show")}
            {open ? <FaChevronUp /> : <FaChevronDown />}
          </Button>
        </div>
      }
    >
      {open && (
        <div className={styles.slots}>
          {candidateCardIds.map((id, index) => {
            const probability = probabilities[index];
            const isBest = probability != null && probability === best;
            return (
              <div key={index} className={styles.slot}>
                <div className={styles.commitRow}>
                  {id ? (
                    <Button
                      style="default"
                      size="sm"
                      pill
                      onClick={() => commit(index)}
                    >
                      {t("commit")}
                    </Button>
                  ) : null}
                </div>
                <div className={styles.cardWrap}>
                  <EntityIcon
                    type={EntityTypes.SKILL_CARD}
                    id={id}
                    onClick={() =>
                      setModal(
                        <EntityPickerModal
                          type={EntityTypes.SKILL_CARD}
                          onPick={(card) => replaceCandidate(index, card.id)}
                          filters={FILTERS}
                        />,
                      )
                    }
                    idolId={idolId}
                    size="fill"
                    showTier
                    showEmptyPlaceholder
                  />
                </div>
                <div
                  className={c(styles.probability, isBest && styles.best)}
                >
                  {probability == null
                    ? "—"
                    : `${(probability * 100).toFixed(2)}%`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

export default memo(DraftPick);
