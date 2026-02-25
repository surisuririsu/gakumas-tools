import { PItems, SkillCards } from "gakumas-data";
import { DEFAULT_EFFECTS, EFFECT_COUNTER_FIELDS, S } from "../constants";
import EngineComponent from "./EngineComponent";
import { shallowCopy } from "../utils";

export default class EffectManager extends EngineComponent {
  initializeState(state) {
    const config = this.getConfig(state);

    state[S.effects] = [];
    state[S.effectCounters] = {};

    // Set default effects
    this.logger.debug("Setting default effects", DEFAULT_EFFECTS);
    this.setEffects(state, DEFAULT_EFFECTS);

    // Set stage effects
    this.logger.debug("Setting stage effects", config.stage.effects);
    this.setEffects(state, config.stage.effects, { type: "stage" });

    // Set p-item effects
    let configs = [config];
    if (config.stage.type === "linkContest") {
      configs = this.engine.linkConfigs || [];
    }

    for (let c = 0; c < configs.length; c++) {
      const { pItemIds } = configs[c].idol;
      for (let i = 0; i < pItemIds.length; i++) {
        const pItem = PItems.getById(pItemIds[i]);
        this.logger.debug("Setting p-item effects", pItem.name, pItem.effects);
        this.setEffects(state, pItem.effects, {
          type: "pItem",
          id: pItemIds[i],
        });
      }
    }

    // Set growth effects
    this.initializeGrowthEffects(state);
  }

  initializeGrowthEffects(state) {
    for (let i = 0; i < state[S.cardMap].length; i++) {
      const skillCardId = state[S.cardMap][i].id;

      const skillCard = SkillCards.getById(skillCardId);
      const growth = this.engine.cardManager.getLines(state, i, "growth");
      if (growth.length) {
        this.logger.debug("Setting growth effects", skillCard.name, growth);
        this.setEffects(state, growth, {
          type: "skillCard",
          id: skillCardId,
          idx: i,
        });
      }
    }
  }

  setEffects(state, effects, source, counterGroupId) {
    // Detect counter variables used in this batch and create a counter group
    // entry in state[S.effectCounters].  A counterGroupId string is attached to
    // every effect in the batch so they all reference the same counter values
    // even after the state has been deep-copied.
    if (!counterGroupId) {
      let counterVars = null;
      for (const effect of effects) {
        const allTokens = [
          ...(effect.actions || []).flat(),
          ...(effect.conditions || []).flat(),
        ];
        for (const token of allTokens) {
          if (token in EFFECT_COUNTER_FIELDS) {
            if (!counterVars) counterVars = {};
            if (!(token in counterVars)) {
              counterVars[token] = EFFECT_COUNTER_FIELDS[token];
            }
          }
        }
      }
      if (counterVars) {
        counterGroupId = String(
          Object.keys(state[S.effectCounters]).length
        );
        state[S.effectCounters][counterGroupId] = counterVars;
      }
    }

    for (let i = 0; i < effects.length; i++) {
      const effect = { ...effects[i] };
      if (source) {
        effect.source = source;
      }
      if (!effect.actions && i < effects.length - 1) {
        effect.effects = [effects[++i]];
      }
      if (counterGroupId) {
        effect.counterGroupId = counterGroupId;
      }
      state[S.effects].push(effect);
    }
  }

  clearPrestageEffects(state) {
    state[S.effects] = state[S.effects].filter(
      (effect) => effect.phase != "prestage"
    );
  }

  clearExpiredEffects(state) {
    state[S.effects] = state[S.effects].map((effect) => {
      if (effect.limit != null && effect.limit < 1) return {};
      if (effect.ttl != null && effect.ttl < 0) return {};
      return effect;
    });
  }

  triggerEffectsForPhase(state, phase, conditionState) {
    state[S.parentPhase] = state[S.phase];
    state[S.phase] = phase;

    // Filter and group effects
    let effectsByGroup = {};
    for (let i = 0; i < state[S.effects].length; i++) {
      const effect = state[S.effects][i];
      if (effect.phase != phase) continue;
      const group = effect.group || 0;
      if (!effectsByGroup[group]) effectsByGroup[group] = [];
      effectsByGroup[group].push({ ...effect, phase: null, index: i });
    }

    // Trigger effects
    const groupKeys = Object.keys(effectsByGroup);
    this.logger.debug(phase, effectsByGroup);
    for (let i = 0; i < groupKeys.length; i++) {
      const triggeredEffects = this.triggerEffects(
        state,
        effectsByGroup[groupKeys[i]],
        conditionState
      );
      for (let j = 0; j < triggeredEffects.length; j++) {
        const effectIndex = triggeredEffects[j];
        if (state[S.effects][effectIndex].limit) {
          state[S.effects][effectIndex].limit--;
        }
      }
    }

    state[S.phase] = state[S.parentPhase];
  }

  triggerEffects(state, effects, cndState, card, skipConditions) {
    const conditionState = cndState || shallowCopy(state);

    let triggeredEffects = [];
    let skipNextEffect = false;

    this.logger.debug(effects);

    // Snapshot each referenced counter group at the start of this call so
    // that conditions are evaluated against values from before any actions in
    // this call have run (mirroring the conditionState snapshot behaviour).
    const counterSnapshots = {};
    for (let i = 0; i < effects.length; i++) {
      const cgId = effects[i].counterGroupId;
      if (cgId != null && !(cgId in counterSnapshots)) {
        counterSnapshots[cgId] = { ...state[S.effectCounters][cgId] };
      }
    }

    // Counter group ID shared by all delayed effects set during this
    // card-play call.  All delayed effects from the same play share one
    // group so their counters stay in sync with each other, while two
    // separate plays (e.g. from a double-effect p-item) each get their
    // own group and therefore their own independent counter.
    let playCounterGroupId = null;

    for (let i = 0; i < effects.length; i++) {
      // Skip effect if condition not satisfied
      if (skipNextEffect) {
        this.logger.debug("Skipping effect", effects[i]);
        skipNextEffect = false;
        continue;
      }

      const effect = effects[i];

      // Delayed effects
      if (effect.phase) {
        this.logger.debug("Setting effects", effect.effects);

        // Detect counter variables used by this delayed effect so we can
        // attach the shared playCounterGroupId.
        const allTokens = [
          ...(effect.actions || []).flat(),
          ...(effect.conditions || []).flat(),
        ];
        let hasCounters = false;
        for (const token of allTokens) {
          if (token in EFFECT_COUNTER_FIELDS) {
            hasCounters = true;
            if (playCounterGroupId === null) {
              playCounterGroupId = String(
                Object.keys(state[S.effectCounters]).length
              );
              state[S.effectCounters][playCounterGroupId] = {};
            }
            if (!(token in state[S.effectCounters][playCounterGroupId])) {
              state[S.effectCounters][playCounterGroupId][token] =
                EFFECT_COUNTER_FIELDS[token];
            }
          }
        }

        this.setEffects(
          state,
          [effect],
          card != null
            ? {
                type: "skillCardEffect",
                id: state[S.cardMap][card].id,
                idx: card,
              }
            : null,
          hasCounters ? playCounterGroupId : undefined
        );
        this.logger.log(state, "setEffect");
        continue;
      }

      // Check limit
      if (effect.limit != null && effect.limit < 1) {
        this.logger.debug("Effect limit reached", effect.limit);
        continue;
      }

      // Check ttl
      if (effect.ttl != null && effect.ttl < 0) {
        this.logger.debug("Effect ttl reached", effect.ttl);
        continue;
      }

      // Check delay
      if (effect.delay != null && effect.delay >= 0) {
        this.logger.debug("Effect delay", effect.delay);
        continue;
      }

      // Patch conditionState with the snapshot counter values (so conditions
      // see the values from before this call's actions ran) and patch state
      // with the current counter values (so actions update the right counter).
      let savedCounterVals = null;
      const cgId = effect.counterGroupId;
      if (cgId != null) {
        savedCounterVals = {};
        const snapshot = counterSnapshots[cgId] || {
          ...state[S.effectCounters][cgId],
        };
        const currentCounters = state[S.effectCounters][cgId];
        for (const key in currentCounters) {
          savedCounterVals[key] = {
            s: state[S[key]],
            cs: conditionState[S[key]],
          };
          conditionState[S[key]] = snapshot[key];
          state[S[key]] = currentCounters[key];
        }
      }

      // Check conditions
      let conditionsMet = true;
      if (!skipConditions && effect.conditions) {
        for (let j = 0; j < effect.conditions.length; j++) {
          const condition = effect.conditions[j];
          if (
            !this.engine.evaluator.evaluateCondition(conditionState, condition)
          ) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (!conditionsMet) {
        // Restore patched values before skipping
        if (savedCounterVals) {
          const currentCounters = state[S.effectCounters][cgId];
          for (const key in currentCounters) {
            state[S[key]] = savedCounterVals[key].s;
            conditionState[S[key]] = savedCounterVals[key].cs;
          }
        }
        if (!effect.actions && !effect.effects) {
          skipNextEffect = true;
        }
        continue;
      }

      // Log source
      if (effect.source) {
        this.logger.log(state, "entityStart", effect.source);
      }

      this.logger.debug("Executing actions", effect.actions);

      // Apply growth or actions or effects
      if (effect.targets) {
        // Identify cards to grow
        let growthCards = new Set();
        for (let j = 0; j < effect.targets.length; j++) {
          const targetRuleCards = this.engine.cardManager.getTargetRuleCards(
            state,
            effect.targets[j],
            effect.source
          );
          for (let card of targetRuleCards) {
            growthCards.add(card);
          }
        }

        // Grow cards
        this.engine.cardManager.grow(state, [...growthCards], effect.actions);
      } else {
        // Execute actions
        if (effect.actions) {
          this.engine.executor.executeActions(state, effect.actions, card);
        }

        // Delayed effects from p-items
        if (effect.effects) {
          this.logger.debug("Setting effects", effect.effects);
          this.setEffects(state, effect.effects, effect.source);
          this.logger.log(state, "setEffect");
        }
      }

      // Log source end
      if (effect.source) {
        this.logger.log(state, "entityEnd", effect.source);
      }

      // Save updated counter values back into state[S.effectCounters] and
      // restore the temporarily patched state / conditionState fields.
      if (savedCounterVals) {
        const currentCounters = state[S.effectCounters][cgId];
        for (const key in currentCounters) {
          currentCounters[key] = state[S[key]];
          state[S[key]] = savedCounterVals[key].s;
          conditionState[S[key]] = savedCounterVals[key].cs;
        }
      }

      // Track triggered effects
      triggeredEffects.push(effect.index);
    }

    return triggeredEffects;
  }

  decrementTtl(state) {
    for (let i = 0; i < state[S.effects].length; i++) {
      if (state[S.effects][i].ttl == null || state[S.effects][i].ttl == -1)
        continue;
      state[S.effects][i].ttl--;
    }
  }

  decrementDelay(state) {
    for (let i = 0; i < state[S.effects].length; i++) {
      if (state[S.effects][i].delay == null || state[S.effects][i].delay == -1)
        continue;
      state[S.effects][i].delay--;
    }
  }
}
