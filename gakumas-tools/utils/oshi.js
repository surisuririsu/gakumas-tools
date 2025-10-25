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
      <IdolIcon idolId={6} />
      伊藤舞音さんが出演された「ぷちうるふ1stみーてぃん2025」限定配信中！
      <br />
      ゴールドメンバーになると昼夜両部観れます！カラオケパートもあるよ！🎶
    </div>
  ),
  initiallyExpanded: false,
  hasBadge: true,
  url: "https://nicochannel.jp/okazuradio/video/smVVkucXkDVDepfujx96xgCf",
};
