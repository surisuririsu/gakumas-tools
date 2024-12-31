const { calculateGainedParams } = require("@/utils/nia");

describe("calculateGainedParams", () => {
  it("Melobang", () => {
    const cases = [
      [1, 972, 64],
      [1, 1153, 76],
      [1, 1477, 86],
      [1, 2429, 91],
      [1, 2702, 92],
      [1, 4571, 92],
      [2, 618, 41],
      [2, 1019, 67],
      [2, 1066, 70],
      [2, 1931, 75],
      [2, 2050, 76],
      [2, 4073, 76],
      [3, 334, 22],
      [3, 809, 54],
      [3, 872, 58],
      [3, 1537, 61],
      [3, 1707, 62],
      [3, 4290, 62],
    ];

    for (let i = 0; i < cases.length; i++) {
      const [order, x, y] = cases[i];
      expect(
        [0, -1].includes(
          calculateGainedParams("melobang", [order, 1, 1], [x, 0, 0])[0] - y
        )
      ).toBe(true);
    }
  });

  it("GALAXY", () => {
    const cases = [
      [1, 8554, 75],
      [1, 11421, 100],
      [1, 13803, 110],
      [1, 24334, 118],
      [1, 25376, 119],
      [1, 64209, 119],
      [2, 3929, 35],
      [2, 9963, 88],
      [2, 10369, 90],
      [2, 17916, 96],
      [2, 20764, 98],
      [2, 29334, 98],
      [3, 582, 6],
      [3, 8129, 72], //
      [3, 8377, 74],
      [3, 9375, 74],
      [3, 14003, 78],
      [3, 24808, 80],
      [3, 33542, 80],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [order, x, y] = cases[i];
      expect(
        [0, -1].includes(
          calculateGainedParams("galaxy", [order, 1, 1], [x, 0, 0])[0] - y
        )
      ).toBe(true);
    }
  });

  it("FINALE", () => {
    const cases = [
      [1, 30217, 124],
      [1, 32762, 134],
      [1, 46091, 160],
      [1, 74937, 171],
      [1, 89581, 172],
      [1, 170917, 172],
      [2, 20470, 84],
      [2, 20470, 84], //
      [2, 31951, 130],
      [2, 62648, 141],
      [2, 65370, 142],
      [2, 113833, 142],
      [3, 1799, 8],
      [3, 24308, 99],
      [3, 26249, 106],
      [3, 44571, 113],
      [3, 70766, 116],
      [3, 96391, 116],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [order, x, y] = cases[i];
      expect(
        [0, -1].includes(
          calculateGainedParams("finale", [order, 1, 1], [x, 0, 0])[0] - y
        )
      ).toBe(true);
    }
  });
});
