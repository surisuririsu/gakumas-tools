import SKILL_CARD_ICON_KEYS from "./images/skillCards/icons/keys.json" with { type: "json" };

const GK_IMG_BASE_URL = process.env.NEXT_PUBLIC_GK_IMG_BASE_URL || "";

const SKILL_CARD_ICON_KEY_SET = new Set(SKILL_CARD_ICON_KEYS);

export default function getImages(entity, idolId = 6) {
  switch (entity?._type) {
    case "idol":
      return { icon: `${GK_IMG_BASE_URL}/idols/${entity.id}.png` };
    case "pDrink":
      return {
        icon: `${GK_IMG_BASE_URL}/p_drinks/icons/${entity.id}.webp`,
        details: `${GK_IMG_BASE_URL}/p_drinks/details/${entity.id}.webp`,
      };
    case "pIdol":
      return { icon: `${GK_IMG_BASE_URL}/p_idols/${entity.id}.webp` };
    case "pItem":
      return {
        icon: `${GK_IMG_BASE_URL}/p_items/icons/${entity.id}.webp`,
        details: `${GK_IMG_BASE_URL}/p_items/details/${entity.id}.webp`,
      };
    case "skillCard": {
      let fileName = `${entity.id}`;
      if (SKILL_CARD_ICON_KEY_SET.has(`${entity.id}_${idolId}`)) {
        fileName = `${entity.id}_${idolId}`;
      } else if (SKILL_CARD_ICON_KEY_SET.has(`${entity.id}_6`)) {
        fileName = `${entity.id}_6`;
      }
      return {
        icon: `${GK_IMG_BASE_URL}/skill_cards/icons/${fileName}.webp`,
        details: `${GK_IMG_BASE_URL}/skill_cards/details/${entity.id}.webp`,
      };
    }
    default:
      return {};
  }
}

export function isGkImgUrl(src) {
  return (
    !!GK_IMG_BASE_URL &&
    typeof src == "string" &&
    src.startsWith(GK_IMG_BASE_URL)
  );
}
