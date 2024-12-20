import { deserializeEffectSequence } from "gakumas-data/lite";

export const CUSTOMIZATIONS = [
  {
    id: "pre1",
    label: "スキルカード使用数追加+1",
    effects: deserializeEffectSequence("do:cardUsesRemaining+=1"),
  },
];

export const CUSTOMIZATIONS_BY_ID = CUSTOMIZATIONS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

export function deserializeCustomizations(str) {
  return str.split("-").map((c) =>
    c
      .split("+")
      // .map((n) => parseInt(n, 10))
      .filter((n) => n in CUSTOMIZATIONS_BY_ID)
  );
}

export function serializeCustomizations(customizations) {
  return customizations.map((c) => c.join("+")).join("-");
}
