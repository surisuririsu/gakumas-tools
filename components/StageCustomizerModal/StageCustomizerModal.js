import { memo, useContext, useState } from "react";
import {
  serializeEffectSequence,
  deserializeEffectSequence,
} from "gakumas-data";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ParametersInput from "@/components/ParametersInput";
import ParametersMultiSelect from "@/components/ParametersMultiSelect";
import ModalContext from "@/contexts/ModalContext";
import styles from "./StageCustomizerModal.module.scss";

function normalizeCriteria(criteria) {
  const nums = criteria.map((c) => c || 0);
  const total = nums[0] + nums[1] + nums[2] || 1;
  return {
    vocal: Math.round((100 * nums[0]) / total) / 100,
    dance: Math.round((100 * nums[1]) / total) / 100,
    visual: Math.round((100 * nums[2]) / total) / 100,
  };
}

function StageCustomizerModal({ initialStage, onApply }) {
  const { closeModal } = useContext(ModalContext);
  const [turnCounts, setTurnCounts] = useState(
    Object.values(initialStage.turnCounts)
  );
  const [firstTurns, setFirstTurns] = useState(
    initialStage.firstTurns.reduce((acc, cur) => ({ ...acc, [cur]: true }), {})
  );
  const [criteria, setCriteria] = useState(
    Object.values(initialStage.criteria)
  );
  const [effects, setEffects] = useState(
    serializeEffectSequence(initialStage.effects)
  );

  function apply() {
    onApply({
      id: "custom",
      name: "カスタム",
      plan: "free",
      turnCounts: {
        vocal: turnCounts[0] || 0,
        dance: turnCounts[1] || 0,
        visual: turnCounts[2] || 0,
      },
      firstTurns: Object.keys(firstTurns).filter((k) => firstTurns[k]),
      criteria: normalizeCriteria(criteria),
      effects: deserializeEffectSequence(effects.replace(/\s/g, "")),
    });
    closeModal();
  }

  return (
    <Modal>
      <div className={styles.stageCustomizer}>
        <label>ターン数</label>
        <ParametersInput
          parameters={turnCounts}
          onChange={setTurnCounts}
          max={100}
        />

        <label>初手ターン</label>
        <ParametersMultiSelect value={firstTurns} onChange={setFirstTurns} />

        <label>審査基準</label>
        <ParametersInput
          parameters={criteria}
          onChange={setCriteria}
          max={100}
          round={false}
        />

        <label>ステージ効果</label>
        <div className={styles.effects}>
          <textarea
            defaultValue={effects}
            onChange={(e) => setEffects(e.target.value)}
          />
          <a
            href="https://github.com/surisuririsu/gakumas-data/blob/master/Effects.md"
            target="_blank"
          >
            効果形式
          </a>
        </div>

        <Button onClick={apply}>適用</Button>
      </div>
    </Modal>
  );
}

export default memo(StageCustomizerModal);
