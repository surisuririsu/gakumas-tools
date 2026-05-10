import { PDrinks, PIdols, PItems, SkillCards } from "gakumas-data";
import {
  comparePDrinks,
  comparePIdols,
  comparePItems,
  compareSkillCards,
} from "@/utils/sort";

export const EntityTypes = {
  P_ITEM: "P_ITEM",
  SKILL_CARD: "SKILL_CARD",
  P_DRINK: "P_DRINK",
  P_IDOL: "P_IDOL",
};

export const ENTITY_DATA_BY_TYPE = {
  [EntityTypes.P_ITEM]: PItems,
  [EntityTypes.SKILL_CARD]: SkillCards,
  [EntityTypes.P_DRINK]: PDrinks,
  [EntityTypes.P_IDOL]: PIdols,
};

export const COMPARE_FN_BY_TYPE = {
  [EntityTypes.P_ITEM]: comparePItems,
  [EntityTypes.SKILL_CARD]: compareSkillCards,
  [EntityTypes.P_DRINK]: comparePDrinks,
  [EntityTypes.P_IDOL]: comparePIdols,
};

// First non-upgraded signature skill card per p-idol id; used as a fallback
// icon when a p-idol has no portrait of its own.
export const SIGNATURE_CARD_BY_PIDOL = SkillCards.getAll().reduce((acc, sc) => {
  if (sc.pIdolId && !sc.upgraded && !acc[sc.pIdolId]) acc[sc.pIdolId] = sc;
  return acc;
}, {});
