import {
  FaAnglesUp,
  FaBook,
  FaCalculator,
  FaChartSimple,
  FaFilm,
  FaPercent,
  FaTrophy,
} from "react-icons/fa6";

export const TOOLS = {
  produceRankCalculator: {
    icon: <FaCalculator />,
    path: "/calculator",
    pinnable: true,
  },
  lessonCalculator: {
    icon: <FaAnglesUp />,
    path: "/lesson-calculator",
    pinnable: true,
  },
  memoryCalculator: {
    icon: <FaPercent />,
    path: "/memory-calculator",
    pinnable: true,
  },
  dex: {
    icon: <FaBook />,
    path: "/dex",
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
