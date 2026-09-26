export function pct(num, denom) {
  if (!denom) return "0.0";
  return ((num / denom) * 100).toFixed(1);
}

const RARITY_ICON_ASPECT = { R: 42 / 44, SR: 62 / 44, SSR: 77 / 44 };

export function rarityIconWidth(rarity, height) {
  return Math.round(height * (RARITY_ICON_ASPECT[rarity] || 1));
}
