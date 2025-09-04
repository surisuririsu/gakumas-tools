import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";

const IdolIcon = ({ idolId }) => {
  const idol = Idols.getById(idolId);
  return (
    <Image
      style={{ verticalAlign: "sub" }}
      src={gkImg(idol).icon}
      alt=""
      width={24}
      height={24}
      draggable={false}
    />
  );
};

export const OSHI_PROPS = {
  text: (
    <div>
      <IdolIcon idolId={12} />
      <IdolIcon idolId={10} />
      <IdolIcon idolId={6} />
      <IdolIcon idolId={8} />
      「Let's GO!! ICHI-NO-NI!!」
    </div>
  ),
  videoId: "RYMg75Xn6sw",
};

// export const OSHI_PROPS = {
//   text: (
//     <div>
//       今夜19時に
//       <IdolIcon idolId={9} />
//       「薄井友里のツイてる！フロンティア」に
//       <IdolIcon idolId={6} />
//       伊藤舞音さんがゲスト出演します！
//     </div>
//   ),
//   initiallyExpanded: true,
//   url: "https://nicochannel.jp/usui/live/smJwrvRwxbnuTZLz3cbbzNYi",
// };

// export const OSHI_PROPS = {
//   text: (
//     <div>
//       今夜20時に
//       <IdolIcon idolId={6} />
//       伊藤舞音・浅見香月の『おかづラジオ』5回目の配信があります！
//       <IdolIcon idolId={5} />
//       花岩香奈さんもゲストで登場します！ぜひ観てみてください！
//     </div>
//   ),
//   initiallyExpanded: true,
//   url: "https://nicochannel.jp/okazuradio/live/smXBG4dkhNHQJqMb774yQNyr",
// };

// export const OSHI_PROPS = {
//   text: (
//     <div>
//       今日18時に、
//       <IdolIcon idolId={5} />
//       「花岩香奈のはないわーるど！」に
//       <IdolIcon idolId={6} />
//       伊藤舞音さんがゲストで登場します！
//       <br />
//       一部無料で視聴できるので、ぜひ観てみてください！
//     </div>
//   ),
//   initiallyExpanded: true,
//   url: "https://audee-membership.jp/hanaiwa-kana/live/smQ6XCWdgM2La2LJiKjPeiy7",
// };

// export const OSHI_PROPS = {
//   text: (
//     <>
//       「初星学園放送部 #49」を聴きましょう！
//       <IdolIcon idolId={6} />
//       <IdolIcon idolId={10} />
//     </>
//   ),
//   initiallyExpanded: true,
//   url: "https://asobichannel.asobistore.jp/watch/9f01driiwg2",
// };

// export const OSHI_PROPS = {
//   text: (
//     <div>
//       今夜20時に、
//       <IdolIcon idolId={6} />
//       伊藤舞音・浅見香月の『おかづラジオ』3回目の配信があります！
//       <br />
//       <IdolIcon idolId={8} />
//       川村玲奈さんもゲストで登場します！
//       <br />
//       一部無料で視聴できるので、ぜひ観てみてください！
//     </div>
//   ),
//   url: "https://nicochannel.jp/okazuradio/live/smSKfik57mLfTYfT2nWvCZ2d",
// };

// export const OSHI_PROPS = {
//   text: "倉本千奈 生誕ミニライブ2025",
//   initiallyExpanded: true,
//   videoId: "CD93hMXh6Yc",
// };
