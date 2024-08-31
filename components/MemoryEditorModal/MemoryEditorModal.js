"use client";
import { memo, useContext } from "react";
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
  } = useContext(MemoryContext);
  const { idolId: workspaceIdolId } = useContext(WorkspaceContext);

  const idolId = PIdols.getById(pIdolId)?.idolId || workspaceIdolId;
  const contestPower = calculateContestPower(params, pItemIds, skillCardIds);
  const skillCardCost = calculateSkillCardCost(skillCardIds);

  return (
    <Modal>
      <div className={styles.memoryEditor}>
        <label>名前</label>
        <div>
          <Input placeholder="名前" value={name} onChange={setName} />
        </div>

        <label>Pアイドル</label>
        <PIdolSelect selected={pIdolId} onChange={setPIdolId} />

        <label>総合力</label>
        {contestPower}

        <label>パラメータ</label>
        <div className={styles.params}>
          <ParametersInput
            parameters={params}
            onChange={setParams}
            withStamina
          />
        </div>

        <label>Pアイテム</label>
        <StagePItems
          pItemIds={pItemIds}
          replacePItemId={replacePItemId}
          size="small"
        />

        <label>スキルカード</label>
        <StageSkillCards
          skillCardIds={skillCardIds}
          replaceSkillCardId={replaceSkillCardId}
          idolId={idolId}
        />
        <div>コスト: {skillCardCost}</div>

        <MemorySave />
      </div>
    </Modal>
  );
}

export default memo(MemoryEditorModal);
