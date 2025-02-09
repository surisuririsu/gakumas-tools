export function getPItemContestPower(pItem) {
  if (pItem.sourceType == "pIdol") {
    if (pItem.rarity == "R") {
      return pItem.upgraded ? 240 : 150;
    }
    if (pItem.rarity == "SR") {
      return pItem.upgraded ? 300 : 225;
    }
    if (pItem.rarity == "SSR") {
      return pItem.upgraded ? 420 : 300;
    }
  } else if (pItem.sourceType == "support") {
    if (pItem.rarity == "SR") {
      return 135;
    } else if (pItem.rarity == "SSR") {
      if (pItem.welfare) {
        return 159;
      } else {
        return 180;
      }
    }
  }
  return 0;
}

export function getSkillCardContestPower(skillCard) {
  if (skillCard.sourceType == "pIdol") {
    return skillCard.upgraded ? 15 : 3;
  } else if (skillCard.sourceType == "support") {
    return skillCard.upgraded ? 126 : 96;
  } else if (skillCard.sourceType == "produce") {
    if (skillCard.rarity == "R") {
      if (skillCard.unlockPlv <= 2) {
        return skillCard.upgraded ? 39 : 30;
      } else {
        return skillCard.upgraded ? 60 : 45;
      }
    }
    if (skillCard.rarity == "SR") {
      if (skillCard.unlockPlv <= 2) {
        return skillCard.upgraded ? 102 : 75;
      } else {
        return skillCard.upgraded ? 141 : 105;
      }
    }
    if (skillCard.rarity == "SSR") {
      return skillCard.upgraded ? 204 : 150;
    }
  }
  return 0;
}
