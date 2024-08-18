"use client";
import { memo, useContext } from "react";
import { PIdols } from "gakumas-data";
import Input from "@/components/Input";
import MemorySave from "@/components/MemorySave";
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
import styles from "./MemoryEditor.module.scss";

function MemoryEditor() {
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
    <div className={styles.memoryEditor}>
      <label>Name</label>
      <div className={styles.name}>
        <Input placeholder="Name" value={name} onChange={setName} />
      </div>

      <label>P-idol</label>
      <PIdolSelect selected={pIdolId} onChange={setPIdolId} />

      <label>Contest Power</label>
      {contestPower}

      <label>Parameters</label>
      <div className={styles.params}>
        <ParametersInput parameters={params} onChange={setParams} withStamina />
      </div>

      <label>P-items</label>
      <StagePItems
        pItemIds={pItemIds}
        replacePItemId={replacePItemId}
        size="small"
      />

      <label>Skill cards</label>
      <StageSkillCards
        skillCardIds={skillCardIds}
        replaceSkillCardId={replaceSkillCardId}
        idolId={idolId}
      />
      <div>コスト: {skillCardCost}</div>

      <MemorySave />
    </div>
  );
}

export default memo(MemoryEditor);
