/**
 * Builds templates for the bottom effect icon on skill cards from the gk-img
 * gallery and the uncustomized cards in the contest loadout fixtures, labeled
 * with the icon each card's data predicts.
 *
 * Usage: pnpm build:effect-icons
 */
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SkillCards } from "gakumas-data";
import { predictBadges } from "../gakumas-tools/utils/inferCustomizations.js";
import { CONTEST_LAYOUT } from "../gakumas-tools/utils/imageProcessing/cardBadges.js";
import {
  findBottomIcon,
  iconColors,
  iconDistance,
} from "../gakumas-tools/utils/imageProcessing/effectIcons.js";
import {
  labeledContestCards,
  loadContestFixture,
  loadImage,
} from "../tests/badges.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICON_DIR = join(REPO_ROOT, "gk-img/docs/skill_cards/icons");
const OUT_PATH = join(
  REPO_ROOT,
  "gakumas-tools/utils/imageProcessing/effectIconTemplates.json",
);
const GALLERY_LAYOUT = { x: 0.125, half: 0.115, bottom: [0.76, 0.92] };
const PER_TYPE = 8;

function sample(image, box, layout, cardId) {
  const type = predictBadges(cardId).icon;
  const icon = findBottomIcon(image, box, layout);
  if (!type || !icon) return null;
  return { type, colors: iconColors(image, icon) };
}

async function gallerySamples() {
  const files = readdirSync(ICON_DIR);
  const samples = [];
  for (const card of SkillCards.getAll()) {
    const file = files.find(
      (f) => f === `${card.id}.webp` || f === `${card.id}_1.webp`,
    );
    if (!file) continue;
    const image = await loadImage(join(ICON_DIR, file));
    const box = { x: 0, y: 0, width: image.width, height: image.height };
    samples.push(sample(image, box, GALLERY_LAYOUT, card.id));
  }
  return samples.filter(Boolean);
}

async function fixtureSamples() {
  const samples = [];
  for await (const { image, box, label, id } of labeledContestCards(
    loadContestFixture(),
  )) {
    if (label[0] === 0)
      samples.push(sample(image, box, CONTEST_LAYOUT.icon, id));
  }
  return samples.filter(Boolean);
}

const encode = (colors) => String.fromCharCode(...colors.map((c) => c + 48));

function pickTemplates(samples) {
  const templates = {};
  const types = new Set(samples.map((s) => s.type));
  for (const type of [...types].filter((t) => !t.startsWith("other:"))) {
    const pool = samples.filter((s) => s.type === type);
    if (pool.length < 2) continue;
    const typical = pool
      .map((s) => ({
        s,
        mean:
          pool.reduce((sum, o) => sum + iconDistance(s.colors, o.colors), 0) /
          pool.length,
      }))
      .sort((a, b) => a.mean - b.mean)
      .slice(0, Math.max(2, Math.ceil(pool.length * 0.8)))
      .map(({ s }) => s);
    const chosen = [typical[0]];
    while (chosen.length < Math.min(PER_TYPE, typical.length)) {
      let farthest = null;
      let farthestDistance = -1;
      for (const candidate of typical) {
        const d = Math.min(
          ...chosen.map((c) => iconDistance(candidate.colors, c.colors)),
        );
        if (d > farthestDistance) {
          farthestDistance = d;
          farthest = candidate;
        }
      }
      chosen.push(farthest);
    }
    templates[type] = chosen.map((c) => encode(c.colors));
  }
  return templates;
}

const sources = [await gallerySamples(), await fixtureSamples()];
const templates = {};
for (const picked of sources.map(pickTemplates)) {
  for (const [type, maps] of Object.entries(picked)) {
    templates[type] = [...(templates[type] || []), ...maps];
  }
}
const samples = sources.flat();
writeFileSync(OUT_PATH, JSON.stringify(templates) + "\n");
console.log(
  `${samples.length} labeled icons, ${Object.keys(templates).length} types → ${OUT_PATH}`,
);
