import { Customizations } from "gakumas-data";

export function deserializeCustomizations(str) {
  try {
    return str.split("-").map((c) =>
      c
        .split("e")
        .filter((e) => e)
        .reduce((acc, cur) => {
          const [k, v] = cur.split("x");
          acc[k] = parseInt(v, 10);
          return acc;
        }, {})
    );
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function serializeCustomizations(customizations) {
  if (!customizations) return "";
  return customizations
    .filter((c) => c)
    .map((c) =>
      Object.keys(c)
        .filter((k) => c[k])
        .map((k) => `${k}x${c[k]}`)
        .join("e")
    )
    .join("-");
}

export function countCustomizations(customizations) {
  if (!customizations) return 0;
  return Object.values(customizations).reduce((acc, cur) => acc + cur, 0);
}

export function fixCustomizations(customizations) {
  return Object.keys(customizations || {})
    .filter(Customizations.getById)
    .reduce((acc, cur) => {
      acc[cur] = customizations[cur];
      return acc;
    }, {});
}
