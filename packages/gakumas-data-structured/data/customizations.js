import CUSTOMIZATIONS from "../json/customizations.json";
import { deserializeEffectSequence } from "../utils/effects";

CUSTOMIZATIONS.forEach((customization) => {
  customization.conditions = deserializeEffectSequence(
    customization.conditions
  );
  customization.cost = deserializeEffectSequence(customization.cost);
  customization.effects = deserializeEffectSequence(customization.effects);
  customization.growth = deserializeEffectSequence(customization.growth);
});

const CUSTOMIZATIONS_BY_ID = CUSTOMIZATIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

class Customizations {
  static getAll() {
    return CUSTOMIZATIONS;
  }

  static getById(id) {
    return CUSTOMIZATIONS_BY_ID[id];
  }
}

export default Customizations;
