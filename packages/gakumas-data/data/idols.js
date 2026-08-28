import IDOLS from "../json/idols.json";

function parseStaminaBonuses(value) {
  if (!value) return [];
  return value.split(",").map((milestone) => {
    const [rank, stamina] = milestone.split(":").map(Number);
    return { rank, stamina };
  });
}

IDOLS.forEach((idol) => {
  idol._type = "idol";
  idol.affectionStaminaBonuses = parseStaminaBonuses(
    idol.affectionStaminaBonuses
  );
});

const IDOLS_BY_ID = IDOLS.reduce((acc, cur) => {
  acc[cur.id] = cur;
  return acc;
}, {});

class Idols {
  static getAll() {
    return IDOLS;
  }

  static getById(id) {
    return IDOLS_BY_ID[id];
  }
}

export default Idols;
