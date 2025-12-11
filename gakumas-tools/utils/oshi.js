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
      「三宅麻理恵のゲーマーズギルド」第99.99回 ゲストは
      <IdolIcon idolId={6} />
      伊藤舞音さんです！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://live.nicovideo.jp/watch/lv349301451",
};
