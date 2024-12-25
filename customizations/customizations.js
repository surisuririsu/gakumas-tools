import CUSTOMIZATIONS from "../json/customizations.json";
import {
  deserializeEffect,
  deserializeEffectSequence,
} from "gakumas-data/lite";

CUSTOMIZATIONS.forEach((customization) => {
  customization.conditions =
    deserializeEffect(customization.conditions).conditions || [];
  customization.cost = deserializeEffect(customization.cost).actions || [];
  customization.effects = deserializeEffectSequence(customization.effects);
  customization.growth = deserializeEffectSequence(customization.growth);
});

const CUSTOMIZATIONS_BY_ID = CUSTOMIZATIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

const CUSTOMIZATIONS_BY_SKILL_CARD_ID = CUSTOMIZATIONS.reduce((acc, cur) => {
  if (!acc[cur.skillCardId]) acc[cur.skillCardId] = [];
  acc[cur.skillCardId].push(cur);
  return acc;
}, {});

class Customizations {
  static getAll() {
    return CUSTOMIZATIONS;
  }

  static getById(id) {
    return CUSTOMIZATIONS_BY_ID[id];
  }

  static getBySkillCardId(id) {
    return CUSTOMIZATIONS_BY_SKILL_CARD_ID[id];
  }
}

export default Customizations;
