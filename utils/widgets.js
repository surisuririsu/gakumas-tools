import {
  FaBook,
  FaCalculator,
  FaFilm,
  FaList,
  FaPen,
  FaTrophy,
} from "react-icons/fa6";
import Dex from "@/components/Dex";
import LoadoutEditor from "@/components/LoadoutEditor";
import Memories from "@/components/Memories";
import MemoryCalculator from "@/components/MemoryCalculator";
import MemoryEditor from "@/components/MemoryEditor";
import ProduceRankCalculator from "@/components/ProduceRankCalculator";

export const WIDGETS = {
  produceRankCalculator: {
    title: "プロデュース評価計算機",
    icon: <FaCalculator />,
    Component: ProduceRankCalculator,
    description:
      "Calculate final exam score needed to achieve each produce rank based on pre-exam parameters",
  },
  dex: {
    title: "P図鑑",
    icon: <FaBook />,
    Component: Dex,
    description: "Filter and view p-item and skill card information",
  },
  memoryCalculator: {
    title: "メモリー計算機",
    icon: (
      <>
        <FaFilm />
        <FaCalculator />
      </>
    ),
    Component: MemoryCalculator,
    fill: true,
    description:
      "Calculate probability of getting desired skill card combinations in memories",
  },
  memoryEditor: {
    title: "メモリー編集",
    icon: (
      <>
        <FaFilm />
        <FaPen />
      </>
    ),
    Component: MemoryEditor,
    fill: true,
    description: "Create, edit, and save memories",
  },
  memories: {
    title: "メモリー一覧",
    icon: (
      <>
        <FaFilm />
        <FaList />
      </>
    ),
    Component: Memories,
    description:
      "Import memories from screenshots and search by p-items and skill cards",
  },
  loadoutEditor: {
    title: "ステージ",
    icon: <FaTrophy />,
    Component: LoadoutEditor,
    fill: true,
    description: "Create and simulate contest loadouts",
  },
};
