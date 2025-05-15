import IDOL_ICONS from "./images/idols/imports";
import P_IDOL_ICONS from "./images/pIdols/imports";
import P_ITEM_ICONS from "./images/pItems/icons/imports";
import P_ITEM_DETAILS from "./images/pItems/details/imports";
import SKILL_CARD_ICONS from "./images/skillCards/icons/imports";
import SKILL_CARD_DETAILS from "./images/skillCards/details/imports";

const GK_IMG_BASE_URL = process.env.NEXT_PUBLIC_GK_IMG_BASE_URL;

export default function getImages(entity, idolId = 6) {
  switch (entity?._type) {
    case "idol":
      return getIdolImages(entity.id);
    case "pIdol":
      return getPIdolImages(entity.id);
    case "pItem":
      return getPItemImages(entity.id);
    case "skillCard":
      return getSkillCardImages(entity.id, idolId);
    default:
      return {};
  }
}

export function isGkImgUrl(src) {
  return typeof src == "string" && src.startsWith(GK_IMG_BASE_URL);
}

function getIdolImages(idolId) {
  return {
    _icon: IDOL_ICONS[idolId],
    icon: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/idols/${idolId}.png`
      : IDOL_ICONS[idolId],
  };
}

function getPIdolImages(pIdolId) {
  return {
    _icon: P_IDOL_ICONS[pIdolId],
    icon: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/p_idols/${pIdolId}.webp`
      : P_IDOL_ICONS[pIdolId],
  };
}

function getPItemImages(pItemId) {
  return {
    _icon: P_ITEM_ICONS[pItemId],
    icon: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/p_items/icons/${pItemId}.webp`
      : P_ITEM_ICONS[pItemId],
    _details: P_ITEM_DETAILS[pItemId],
    details: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/p_items/details/${pItemId}.webp`
      : P_ITEM_DETAILS[pItemId],
  };
}

function getSkillCardImages(skillCardId, idolId) {
  let fileName = skillCardId;
  if (`${skillCardId}_${idolId}` in SKILL_CARD_ICONS) {
    fileName = `${skillCardId}_${idolId}`;
  } else if (`${skillCardId}_6` in SKILL_CARD_ICONS) {
    fileName = `${skillCardId}_6`;
  }
  return {
    _icon: SKILL_CARD_ICONS[fileName],
    icon: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/skill_cards/icons/${fileName}.webp`
      : SKILL_CARD_ICONS[fileName],
    _details: SKILL_CARD_DETAILS[skillCardId],
    details: GK_IMG_BASE_URL
      ? `${GK_IMG_BASE_URL}/skill_cards/details/${skillCardId}.webp`
      : SKILL_CARD_DETAILS[skillCardId],
  };
}
