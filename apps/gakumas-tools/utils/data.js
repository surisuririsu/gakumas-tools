import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";
import SKILL_CARD_ICONS from "gakumas-data/images/skillCards/icons/imports";

export const GH_PAGES_BASE_URL = "https://gkimg.ris.moe";

let initialized = false;

if (!initialized) {
  PItems.getAll().forEach((pItem) => {
    pItem._getIcon = pItem.getIcon;
  });
  SkillCards.getAll().forEach((skillCard) => {
    skillCard._getIcon = skillCard.getIcon;
  });

  if (process.env.NEXT_PUBLIC_USE_GH_PAGES == "true") {
    Idols.getAll().forEach((idol) => {
      idol.getIcon = () => `${GH_PAGES_BASE_URL}/idols/${idol.id}.png`;
    });
    PIdols.getAll().forEach((pIdol) => {
      pIdol.getIcon = () => `${GH_PAGES_BASE_URL}/p_idols/${pIdol.id}.webp`;
    });
    PItems.getAll().forEach((pItem) => {
      pItem.getIcon = () =>
        `${GH_PAGES_BASE_URL}/p_items/icons/${pItem.id}.webp`;
      pItem.details = `${GH_PAGES_BASE_URL}/p_items/details/${pItem.id}.webp`;
    });
    SkillCards.getAll().forEach((skillCard) => {
      skillCard.getIcon = (idolId = 1) => {
        const fileName =
          `${skillCard.id}_${idolId}` in SKILL_CARD_ICONS
            ? `${skillCard.id}_${idolId}`
            : skillCard.id;
        return `${GH_PAGES_BASE_URL}/skill_cards/icons/${fileName}.webp`;
      };
      skillCard.details = `${GH_PAGES_BASE_URL}/skill_cards/details/${skillCard.id}.webp`;
    });
  }

  initialized = true;
}

export * from "gakumas-data";
