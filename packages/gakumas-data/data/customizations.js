import CUSTOMIZATIONS from "../json/customizations.json";
import { deserializePatchSequence } from "../utils/effects";

CUSTOMIZATIONS.forEach((customization) => {
  customization.conditions = deserializePatchSequence(customization.conditions);
  customization.cost = deserializePatchSequence(customization.cost);
  customization.actions = deserializePatchSequence(customization.actions);
  customization.effects = deserializePatchSequence(customization.effects);
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
