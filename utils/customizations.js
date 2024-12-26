import Customizations from "@/customizations/customizations";

export function deserializeCustomizations(str) {
  return str.split("-").map(
    (c) => c.split("+")
    // .map((n) => parseInt(n, 10))
  );
}

export function serializeCustomizations(customizations) {
  return customizations.map((c) => c.join("+")).join("-");
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
