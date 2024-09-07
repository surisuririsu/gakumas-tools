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
      <span style={{ lineHeight: 0 }}>
        <FaFilm />
        <FaCalculator />
      </span>
    ),
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
    path: "/simulator",
    pinnable: true,
  },
  rehearsal: {
    icon: <FaChartSimple />,
    path: "/rehearsal",
    pinnable: true,
  },
};
