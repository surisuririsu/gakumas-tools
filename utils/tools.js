import {
  FaBook,
  FaCalculator,
  FaChartSimple,
  FaFilm,
  FaHouse,
  FaTrophy,
} from "react-icons/fa6";

export const TOOLS = {
  home: {
    icon: <FaHouse />,
    path: "/",
  },
  produceRankCalculator: {
    icon: <FaCalculator />,
    path: "/produce-rank-calculator",
    pinnable: true,
  },
  dex: {
    icon: <FaBook />,
    path: "/dex",
    pinnable: true,
  },
  memoryCalculator: {
    icon: (
      <span>
        <FaFilm />
        <FaCalculator />
      </span>
    ),
    fill: true,
    path: "/memory-calculator",
    pinnable: true,
  },
  memories: {
    icon: <FaFilm />,
    path: "/memories",
    pinnable: true,
  },
  simulator: {
    icon: <FaTrophy />,
    fill: true,
    path: "/simulator",
    pinnable: true,
  },
  rehearsal: {
    icon: <FaChartSimple />,
    fill: true,
    path: "/rehearsal",
    pinnable: true,
  },
};
