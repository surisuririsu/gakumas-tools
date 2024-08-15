import {
  FaBook,
  FaCalculator,
  FaFilm,
  FaHouse,
  FaList,
  FaPen,
  FaTrophy,
} from "react-icons/fa6";

export const TOOLS = {
  home: {
    title: "ホーム",
    icon: <FaHouse />,
    description: "Home page with overview of available tools",
    path: "/",
  },
  produceRankCalculator: {
    title: "プロデュース評価計算機",
    icon: <FaCalculator />,
    description:
      "Calculate final exam score needed to achieve each produce rank based on pre-exam parameters",
    path: "/produce-rank-calculator",
    pinnable: true,
  },
  dex: {
    title: "P図鑑",
    icon: <FaBook />,
    description: "Filter and view p-item and skill card information",
    path: "/dex",
    pinnable: true,
  },
  memoryCalculator: {
    title: "メモリー計算機",
    icon: (
      <>
        <FaFilm />
        <FaCalculator />
      </>
    ),
    fill: true,
    description:
      "Calculate probability of getting desired skill card combinations in memories",
    path: "/memory-calculator",
    pinnable: true,
  },
  memoryEditor: {
    title: "メモリー編集",
    icon: (
      <>
        <FaFilm />
        <FaPen />
      </>
    ),
    fill: true,
    description: "Create, edit, and save memories",
    path: "/memory-editor",
    pinnable: true,
  },
  memories: {
    title: "メモリー一覧",
    icon: (
      <>
        <FaFilm />
        <FaList />
      </>
    ),
    description:
      "Import memories from screenshots and search by p-items and skill cards",
    path: "/memories",
    pinnable: true,
  },
  simulator: {
    title: "シミュレーター",
    icon: <FaTrophy />,
    fill: true,
    description: "Create and simulate contest loadouts",
    path: "/simulator",
    pinnable: true,
  },
};
