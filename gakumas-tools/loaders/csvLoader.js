module.exports = function csvLoader(source) {
  const callback = this.async();
  import("gakumas-data/utils/csv.js").then(
    ({ parseCsvRecords }) =>
      callback(null, JSON.stringify(parseCsvRecords(source))),
    callback
  );
};
