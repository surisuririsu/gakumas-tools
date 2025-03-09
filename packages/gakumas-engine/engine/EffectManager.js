import { Customizations, PItems, SkillCards } from "gakumas-data";
import { DEFAULT_EFFECTS, S } from "../constants";
import EngineComponent from "./EngineComponent";
import { shallowCopy } from "../utils";

export default class EffectManager extends EngineComponent {
  initializeState(state) {
    state[S.effects] = [];

    // Set default effects
    this.logger.debug("Setting default effects", DEFAULT_EFFECTS);
    this.setEffects(state, DEFAULT_EFFECTS);

    // Set stage effects
    this.logger.debug("Setting stage effects", this.config.stage.effects);
    this.setEffects(state, this.config.stage.effects, { type: "stage" });

    // Set p-item effects
    const { pItemIds } = this.config.idol;
    for (let i = 0; i < pItemIds.length; i++) {
      const pItem = PItems.getById(pItemIds[i]);
      this.logger.debug("Setting p-item effects", pItem.name, pItem.effects);
      this.setEffects(state, pItem.effects, { type: "pItem", id: pItemIds[i] });
    }

    // Set growth effects
    for (let i = 0; i < state[S.cardMap].length; i++) {
      const skillCardId = state[S.cardMap][i].id;

      const skillCard = SkillCards.getById(skillCardId);
      if (skillCard.growth?.length) {
        this.logger.debug(
          "Setting growth effects",
          skillCard.name,
          skillCard.growth
        );
        this.setEffects(state, skillCard.growth, {
          type: "skillCard",
          id: skillCardId,
          idx: i,
        });
      }

      const c11n = state[S.cardMap][i].c11n;
      for (let k in c11n) {
        const { growth, name } = Customizations.getById(k);
        if (!growth.length) continue;
        this.logger.debug(
          "Setting custom growth effects",
          skillCard.name,
          growth,
          name
        );
        this.setEffects(
          state,
          growth.filter((g) => (g.level || 1) == c11n[k]),
          {
            type: "skillCard",
            id: skillCardId,
            idx: i,
          }
        );
      }
    }
  }

  setEffects(state, effects, source) {
    for (let i = 0; i < effects.length; i++) {
      const effect = { ...effects[i] };
      if (source) {
        effect.source = source;
      }
      if (!effect.actions && i < effects.length - 1) {
        effect.effects = [effects[++i]];
      }
      state[S.effects].push(effect);
    }
  }

  clearPrestageEffects(state) {
    state[S.effects] = state[S.effects].filter(
      (effect) => effect.phase != "prestage"
    );
  }

  triggerEffectsForPhase(state, phase, conditionState) {
    const parentPhase = state[S.phase];
    state[S.phase] = phase;

    // Filter and group effects
    let effectsByGroup = {};
    for (let i = 0; i < state[S.effects].length; i++) {
      const effect = state[S.effects][i];
      if (effect.phase != phase) continue;
      const group = (effect.group || 0) + 10;
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

    state[S.phase] = parentPhase;
  }

  triggerEffects(state, effects, cndState, card, skipConditions) {
    const conditionState = cndState || shallowCopy(state);

    let triggeredEffects = [];
    let skipNextEffect = false;

    this.logger.debug(effects);

    for (let i = 0; i < effects.length; i++) {
      // Skip effect if condition not satisfied
      if (skipNextEffect) {
        skipNextEffect = false;
        continue;
      }

      const effect = effects[i];

      // Delayed effects
      if (effect.phase) {
        this.logger.debug("Setting effects", effect.effects);
        this.setEffects(
          state,
          [{ ...effect, group: card != null ? 10 : null }],
          card != null
            ? { type: "skillCardEffect", id: state[S.cardMap][card].id }
            : null
        );
        this.logger.log(state, "setEffect");
        continue;
      }

      // Check limit
      if (effect.limit != null && effect.limit < 1) {
        continue;
      }

      // Check ttl
      if (effect.ttl != null && effect.ttl < 0) {
        continue;
      }

      // Check conditions
      if (!skipConditions && effect.conditions) {
        let satisfied = true;
        for (let j = 0; j < effect.conditions.length; j++) {
          const condition = effect.conditions[j];
          if (
            !this.engine.evaluator.evaluateCondition(conditionState, condition)
          ) {
            satisfied = false;
            break;
          }
        }
        if (!satisfied) {
          if (!effect.actions) {
            skipNextEffect = true;
          }
          continue;
        }
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
}
