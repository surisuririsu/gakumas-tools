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
      <IdolIcon idolId={9} />
      <IdolIcon idolId={8} />
      『薄井友里・川村玲奈のすーぱーかわちぃ☆ゆりれいしょん』#7はゲストに飯田ヒカルさんと伊藤舞音さんをお迎えいたします。
      <IdolIcon idolId={3} />
      <IdolIcon idolId={6} />
    </div>
  ),
  initiallyExpanded: true,
  url: "https://live.nicovideo.jp/watch/lv348959635",
};
