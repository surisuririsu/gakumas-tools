"use client";
import { memo, useContext } from "react";
import { useTranslations } from "next-intl";
import { PIdols } from "gakumas-data";
import Input from "@/components/Input";
import MemorySave from "@/components/MemorySave";
import Modal from "@/components/Modal";
import ParametersInput from "@/components/ParametersInput";
import PIdolSelect from "@/components/PIdolSelect";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import MemoryContext from "@/contexts/MemoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import {
  calculateContestPower,
  calculateSkillCardCost,
} from "@/utils/contestPower";
import styles from "./MemoryEditorModal.module.scss";

function MemoryEditorModal() {
  const t = useTranslations("MemoryEditorModal");

  const {
    name,
    setName,
    pIdolId,
    setPIdolId,
    params,
    setParams,
    pItemIds,
    replacePItemId,
    skillCardIds,
    replaceSkillCardId,
    customizations,
    replaceCustomizations,
  } = useContext(MemoryContext);
  const { idolId: workspaceIdolId } = useContext(WorkspaceContext);

  const idolId = PIdols.getById(pIdolId)?.idolId || workspaceIdolId;
  const contestPower = calculateContestPower(
    params,
    pItemIds,
    skillCardIds,
    customizations
  );
  const skillCardCost = calculateSkillCardCost(skillCardIds);

  return (
    <Modal>
      <div className={styles.memoryEditor}>
        <div>
          <Input placeholder={t("name")} value={name} onChange={setName} />
        </div>

        <PIdolSelect selected={pIdolId} onChange={setPIdolId} />

        <div className={styles.power}>
          <label>{t("contestPower")}</label>
          {contestPower}
        </div>

        <div className={styles.params}>
          <ParametersInput
            parameters={params}
            onChange={setParams}
            withStamina
          />
        </div>

        <StagePItems
          pItemIds={pItemIds}
          replacePItemId={replacePItemId}
          size="medium"
        />

        <StageSkillCards
          skillCardIds={skillCardIds}
          customizations={customizations}
          replaceSkillCardId={replaceSkillCardId}
          replaceCustomizations={replaceCustomizations}
          idolId={idolId}
        />
        <div>
          {t("cost")}: {skillCardCost}
        </div>

        <MemorySave />
      </div>
    </Modal>
  );
}

export default memo(MemoryEditorModal);
