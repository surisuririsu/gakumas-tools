import P_DRINKS from "../json/p_drinks.json" with { type: "json" };
import { deserializeEffectSequence } from "../utils/effects.js";

P_DRINKS.forEach((pDrink) => {
  pDrink._type = "pDrink";
  pDrink.effects = deserializeEffectSequence(pDrink.effects);
});

const P_DRINKS_BY_ID = P_DRINKS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

class PDrinks {
  static getAll() {
    return P_DRINKS;
  }

  static getById(id) {
    return P_DRINKS_BY_ID[id];
  }

  static getFiltered({ rarities, plans }) {
    return P_DRINKS.filter((pDrink) => {
      if (rarities && !rarities.includes(pDrink.rarity)) return false;
      if (plans && !plans.includes(pDrink.plan)) return false;
      return true;
    });
  }
}

export default PDrinks;
