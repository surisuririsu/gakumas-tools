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
      今日20時に、「三宅麻理恵のゲーマーズギルド」に
      <IdolIcon idolId={6} />
      伊藤舞音さんがゲストで出演します！
      <br />
      番組前半はどなたでもご視聴いただけます！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://live.nicovideo.jp/watch/lv348799112",
};
