export const TYPES = ["vocal", "dance", "visual"];

// Columns the user can sort by. `card` is the only text sort; the rest are
// numeric (and default to descending on first click).
export const SORTABLE_COLS = ["card", "use", "usePct", "score"];

export const DEFAULT_SORT = { by: "usePct", dir: "desc" };
