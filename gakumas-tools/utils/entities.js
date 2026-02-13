import { PDrinks, PIdols, PItems, SkillCards } from "gakumas-data";
import { comparePDrinks, comparePItems, compareSkillCards } from "@/utils/sort";

export const EntityTypes = {
  P_IDOL: "P_IDOL",
  P_ITEM: "P_ITEM",
  SKILL_CARD: "SKILL_CARD",
  P_DRINK: "P_DRINK",
};

export const ENTITY_DATA_BY_TYPE = {
  [EntityTypes.P_IDOL]: PIdols,
  [EntityTypes.P_ITEM]: PItems,
  [EntityTypes.SKILL_CARD]: SkillCards,
  [EntityTypes.P_DRINK]: PDrinks,
};

export const COMPARE_FN_BY_TYPE = {
  [EntityTypes.P_IDOL]: (a, b) => a.id - b.id,
  [EntityTypes.P_ITEM]: comparePItems,
  [EntityTypes.SKILL_CARD]: compareSkillCards,
  [EntityTypes.P_DRINK]: comparePDrinks,
};
