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
