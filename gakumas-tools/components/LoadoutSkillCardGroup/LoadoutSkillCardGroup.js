import { memo, useContext, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  FaCirclePlus,
  FaCircleArrowUp,
  FaCircleArrowDown,
  FaCircleXmark,
  FaEllipsis,
  FaImage,
  FaFilm,
  FaPercent,
} from "react-icons/fa6";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import MemoryPickerModal from "@/components/MemoryPickerModal";
import StageSkillCards from "@/components/StageSkillCards";
import LoadoutContext from "@/contexts/LoadoutContext";
import MemoryCalculatorContext from "@/contexts/MemoryCalculatorContext";
import ModalContext from "@/contexts/ModalContext";
import { useRouter } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./LoadoutSkillCardGroup.module.scss";

function LoadoutSkillCardGroup({
  skillCardIds,
  customizations,
  indications,
  groupIndex,
  idolId,
}) {
  const t = useTranslations("LoadoutSkillCardGroup");
  const { status } = useSession();
  const router = useRouter();
  const {
    loadout,
    setMemory,
    replaceSkillCardId,
    swapSkillCardIds,
    replaceCustomizations,
    insertSkillCardIdGroup,
    deleteSkillCardIdGroup,
    swapSkillCardIdGroups,
  } = useContext(LoadoutContext);
  const { setTargetSkillCardIds, setAcquiredSkillCardIds } = useContext(
    MemoryCalculatorContext,
  );
  const { setModal, closeModal } = useContext(ModalContext);
  const [expanded, setExpanded] = useState(false);
  const [costExpanded, setCostExpanded] = useState(false);

  const costBreakdown = useMemo(
    () =>
      skillCardIds
        .filter((id) => id)
        .map((id) => {
          const card = SkillCards.getById(id);
          return {
            id,
            name: card.name,
            cost: card.sourceType == "pIdol" ? 0 : card.contestPower,
            card,
          };
        }),
    [skillCardIds],
  );

  const cost = useMemo(
    () => costBreakdown.reduce((acc, cur) => acc + cur.cost, 0),
    [costBreakdown],
  );

  return (
    <div>
      <StageSkillCards
        skillCardIds={skillCardIds}
        customizations={customizations}
        replaceSkillCardId={replaceSkillCardId}
        swapSkillCardIds={swapSkillCardIds}
        replaceCustomizations={replaceCustomizations}
        indications={indications}
        idolId={idolId}
        groupIndex={groupIndex}
      />

      <div className={styles.sub}>
        <div className={styles.costWrapper}>
          <button
            type="button"
            className={c(styles.cost, costExpanded && styles.costOpen)}
            onClick={() => setCostExpanded((v) => !v)}
            aria-expanded={costExpanded}
          >
            {t("cost")}: {cost}
          </button>
        </div>
        <div
          className={c(styles.buttonGroup, expanded && styles.expanded)}
          onClick={() => setExpanded(false)}
          data-export-hide="true"
        >
          <button
            className={styles.memoryCalculatorButton}
            onClick={() => {
              const nonPidolSkillCardIds = skillCardIds.filter(
                (id) => SkillCards.getById(id).sourceType != "pIdol",
              );
              setTargetSkillCardIds(() => nonPidolSkillCardIds);
              setAcquiredSkillCardIds(() => nonPidolSkillCardIds);
              router.push("/memory-calculator");
            }}
          >
            <FaPercent title={t("memoryCalculator")} />
          </button>

          {status == "authenticated" && (
            <button
              className={styles.pickButton}
              onClick={() => setModal(<MemoryPickerModal index={groupIndex} />)}
            >
              <FaFilm title={t("memories")} />
            </button>
          )}

          <button
            className={styles.importButton}
            onClick={() =>
              setModal(
                <MemoryImporterModal
                  multiple={false}
                  onSuccess={(memories) => {
                    setMemory(memories[0], groupIndex);
                    closeModal();
                  }}
                />,
              )
            }
          >
            <FaImage title={t("importMemory")} />
          </button>

          <button
            className={styles.addButton}
            onClick={() => insertSkillCardIdGroup(groupIndex + 1)}
          >
            <FaCirclePlus title={t("addRow")} />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => swapSkillCardIdGroups(groupIndex, groupIndex - 1)}
            disabled={groupIndex < 1}
          >
            <FaCircleArrowUp title={t("moveUp")} />
          </button>

          <button
            className={styles.moveButton}
            onClick={() => swapSkillCardIdGroups(groupIndex, groupIndex + 1)}
            disabled={groupIndex >= loadout.skillCardIdGroups.length - 1}
          >
            <FaCircleArrowDown title={t("moveDown")} />
          </button>

          <button
            className={styles.deleteButton}
            onClick={() => deleteSkillCardIdGroup(groupIndex)}
            disabled={loadout.skillCardIdGroups.length < 2}
          >
            <FaCircleXmark title={t("removeRow")} />
          </button>
        </div>
        <button
          className={styles.expandButton}
          onClick={(e) => {
            setExpanded(!expanded);
            e.stopPropagation();
          }}
        >
          <FaEllipsis />
        </button>
      </div>

      {costExpanded && (
        <ul className={styles.costBreakdown} data-export-hide="true">
          {costBreakdown.map((item, i) => (
            <li key={`${i}_${item.id}`}>
              <Image
                src={gkImg(item.card, idolId).icon}
                width={20}
                height={20}
                alt=""
              />
              <span className={styles.breakdownName}>{item.name}</span>
              <span className={styles.breakdownCost}>{item.cost}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(LoadoutSkillCardGroup);
