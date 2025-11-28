import { useTranslations } from "next-intl";
import { ALL_FIELDS, S } from "gakumas-engine";
import TurnIndicator from "./TurnIndicator";
import styles from "./SimulatorLogs.module.scss";

const BUFFS_MAP = {
  [S.scoreBuffs]: "scoreBuff",
  [S.scoreDebuffs]: "scoreDebuff",
  [S.goodImpressionTurnsBuffs]: "goodImpressionTurnsBuff",
  [S.goodImpressionTurnsEffectBuffs]: "goodImpressionTurnsEffectBuff",
  [S.motivationBuffs]: "motivationBuff",
  [S.goodConditionTurnsBuffs]: "goodConditionTurnsBuff",
  [S.concentrationBuffs]: "concentrationBuff",
  [S.enthusiasmBuffs]: "enthusiasmBuff",
  [S.fullPowerChargeBuffs]: "fullPowerChargeBuff",
};

function HandStateLine({ k, state }) {
  const t = useTranslations("stage");

  const buffKey = BUFFS_MAP[k];

  if (buffKey) {
    return state[k].map(({ amount, turns }) => (
      <div key={turns}>
        {t(buffKey)}{" "}
        <span className={styles.blue}>{Math.round(amount * 100)}%</span>{" "}
        {turns ? `(${t("numTurns", { num: turns })})` : ""}
      </div>
    ));
  }

  return (
    <div>
      {t(ALL_FIELDS[k])}{" "}
      <span className={styles.blue}>
        {isNaN(state[k]) ? t(state[k]) : state[k]}
      </span>
    </div>
  );
}

function HandState({ state }) {
  const { turn, ...rest } = state;

  return (
    <div className={styles.state}>
      <div className={styles.stateContent}>
        <div className={styles.turnIndicatorWrapper}>
          <TurnIndicator turn={turn} />
        </div>
        <div className={styles.stateLines}>
          {Object.keys(rest).map((k) => (
            <HandStateLine key={k} k={k} state={rest} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HandState;
