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
    title: "トップページ",
    icon: <FaHouse />,
    description: "機能一覧",
    path: "/",
  },
  produceRankCalculator: {
    title: "プロデュース評価計算機",
    icon: <FaCalculator />,
    description: "プロデュース評価に必要な最終試験スコアを計算する",
    path: "/produce-rank-calculator",
    pinnable: true,
  },
  dex: {
    title: "P図鑑",
    icon: <FaBook />,
    description: "Pアイテムとスキルカード情報を表示する",
    path: "/dex",
    pinnable: true,
  },
  memoryCalculator: {
    title: "メモリー生成確率計算機",
    icon: (
      <span>
        <FaFilm />
        <FaCalculator />
      </span>
    ),
    fill: true,
    description: "欲しいメモリーの生成確率を計算する",
    path: "/memory-calculator",
    pinnable: true,
  },
  memories: {
    title: "メモリー",
    icon: <FaFilm />,
    description: "メモリーを制作、保存、Pアイテムとスキルカードで検索する",
    path: "/memories",
  },
  simulator: {
    title: "シミュレーター",
    icon: <FaTrophy />,
    fill: true,
    description: "コンテスト編成を作成、シミュレーターでスコアを予測する",
    path: "/simulator",
    pinnable: true,
  },
  rehearsal: {
    title: "リハーサル読み取り",
    icon: <FaChartSimple />,
    fill: true,
    description: "リハーサル画面からスコアを読み取る",
    path: "/rehearsal",
    pinnable: true,
  },
};
