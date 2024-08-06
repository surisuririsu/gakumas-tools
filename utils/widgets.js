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
  },
  dex: {
    title: "P図鑑",
    icon: <FaBook />,
    Component: Dex,
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
  },
  loadoutEditor: {
    title: "ステージ編成",
    icon: (
      <>
        <FaTrophy />
        <FaPen />
      </>
    ),
    Component: LoadoutEditor,
    fill: true,
  },
};
