export default class IdolConfig {
  constructor(parameters, supportBonus, criteria, pItems, skillCards) {
    this.parameters = parameters;
    this.supportBonus = supportBonus;
    this.typeMultipliers = this.getTypeMultipliers(
      parameters,
      supportBonus,
      criteria
    );
    this.pItems = pItems;
    this.skillCards = skillCards;
  }

  getTypeMultipliers(parameters, supportBonus, criteria) {
    return Object.keys(criteria).reduce((acc, cur) => {
      let multiplier = 0;
      if (parameters[cur] > 1200) {
        multiplier = parameters[cur] * 1 + 300 * 10;
      } else if (parameters[cur] > 900) {
        multiplier = parameters[cur] * 2 + 300 * 6;
      } else if (parameters[cur] > 600) {
        multiplier = parameters[cur] * 3 + 300 * 3;
      } else if (parameters[cur] > 300) {
        multiplier = parameters[cur] * 4 + 300 * 1;
      } else if (parameters[cur] > 0) {
        multiplier = parameters[cur] * 5 + 1;
      }
      multiplier = multiplier * criteria[cur] + 100;
      multiplier = Math.ceil(multiplier) * (1 + supportBonus);
      multiplier = Math.ceil(Math.floor(multiplier * 10) / 10);
      acc[cur] = multiplier / 100;
      return acc;
    }, {});
  }
}
