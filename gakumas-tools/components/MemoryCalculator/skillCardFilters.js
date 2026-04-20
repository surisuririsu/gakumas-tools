export const NON_PIDOL_FILTER = {
  callback: (e) => e.sourceType != "pIdol",
};

export const PRODUCE_ONLY_FILTER = {
  callback: (e) => e.sourceType == "produce",
};
