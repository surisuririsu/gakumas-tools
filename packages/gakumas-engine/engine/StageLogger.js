import { DEBUG, GRAPHED_FIELDS, LOGGED_FIELDS, S } from "../constants";
import { CLONE_SHARE, deepCopy } from "../utils";

function freshGraphData() {
  const g = { [CLONE_SHARE]: true };
  for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
    g[GRAPHED_FIELDS[i]] = [];
  }
  return g;
}

const LOGGED_BUFFS_FIELDS = [
  S.scoreBuffs,
  S.scoreDebuffs,
  S.goodImpressionTurnsBuffs,
  S.goodImpressionTurnsEffectBuffs,
  S.motivationBuffs,
  S.motivationAdditionBuffs,
  S.goodConditionTurnsBuffs,
  S.concentrationBuffs,
  S.concentrationAdditionBuffs,
  S.enthusiasmBuffs,
  S.enthusiasmBonusBuffs,
  S.fullPowerChargeBuffs,
];

export default class StageLogger {
  constructor(engine) {
    this.engine = engine;
    this.reset();
  }

  initializeState(state) {
    state[S.logs] = [];
    state[S.graphData] = freshGraphData();
  }

  reset() {
    this.logs = [];
    this.disabled = false;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  pickLogs(state) {
    const logs = state[S.logs].map((logIndex) => this.logs[logIndex]);
    this.logs = [];
    return logs;
  }

  log(state, logType, data) {
    if (this.disabled) return;
    this.logs.push({ logType, data });
    const idx = this.logs.length - 1;
    state[S.logs].push(idx);
    return idx;
  }

  debug(...args) {
    if (!DEBUG || this.disabled) return;
    console.log(...args);
  }

  pushGraphData(state) {
    if (this.disabled) return;
    // graphData is shared across states via the CLONE_SHARE marker, so
    // mutating in place would bleed into sibling states (HeuristicStrategy
    // speculation branches). Produce a fresh graphData with appended
    // values and swap it in.
    const curr = state[S.graphData];
    const next = { [CLONE_SHARE]: true };
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      const f = GRAPHED_FIELDS[i];
      const arr = curr[f].slice();
      arr.push(state[f]);
      next[f] = arr;
    }
    state[S.graphData] = next;
  }

  getHandStateForLogging(state) {
    let res = {};
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      if (LOGGED_FIELDS[i] == S.turnsRemaining) continue;
      if (LOGGED_FIELDS[i] == S.cardUsesRemaining) continue;
      if (state[LOGGED_FIELDS[i]]) {
        res[LOGGED_FIELDS[i]] = state[LOGGED_FIELDS[i]];
      }
    }

    for (let field of LOGGED_BUFFS_FIELDS) {
      if (state[field]?.length) {
        // Shallow-slice suffices: buffs are treated as immutable (all
        // mutations go through BuffManager which replaces entries
        // rather than mutating them).
        res[field] = state[field].slice();
      }
    }

    res.turn = {
      types: state[S.turnTypes],
      remaining: state[S.turnsRemaining],
      multiplier: this.engine.turnManager.getTurnMultiplier(state),
    };

    return res;
  }
}
