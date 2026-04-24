import IDOL_ICONS from "./images/idols/imports.js";
import P_DRINK_ICONS from "./images/pDrinks/icons/imports.js";
import P_DRINK_DETAILS from "./images/pDrinks/details/imports.js";
import P_IDOL_ICONS from "./images/pIdols/imports.js";
import P_ITEM_ICONS from "./images/pItems/icons/imports.js";
import P_ITEM_DETAILS from "./images/pItems/details/imports.js";
import SKILL_CARD_ICONS from "./images/skillCards/icons/imports.js";
import SKILL_CARD_DETAILS from "./images/skillCards/details/imports.js";

export default function getImages(entity, idolId = 6) {
  switch (entity?._type) {
    case "idol":
      return { icon: IDOL_ICONS[entity.id] };
    case "pDrink":
      return {
        icon: P_DRINK_ICONS[entity.id],
        details: P_DRINK_DETAILS[entity.id],
      };
    case "pIdol":
      return { icon: P_IDOL_ICONS[entity.id] };
    case "pItem":
      return {
        icon: P_ITEM_ICONS[entity.id],
        details: P_ITEM_DETAILS[entity.id],
      };
    case "skillCard": {
      let fileName = `${entity.id}`;
      if (`${entity.id}_${idolId}` in SKILL_CARD_ICONS) {
        fileName = `${entity.id}_${idolId}`;
      } else if (`${entity.id}_6` in SKILL_CARD_ICONS) {
        fileName = `${entity.id}_6`;
      }
      return {
        icon: SKILL_CARD_ICONS[fileName],
        details: SKILL_CARD_DETAILS[entity.id],
      };
    }
    default:
      return {};
  }
}

export function isGkImgUrl() {
  return false;
}
