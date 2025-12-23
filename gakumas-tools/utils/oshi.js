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
      ペイトン尚未の「クリエイト倶楽部」第46回
      <br />
      ゲストは伊藤舞音さん！
      <IdolIcon idolId={6} />
    </div>
  ),
  initiallyExpanded: true,
  url: "https://nicochannel.jp/paytoncreate/live/smU2C6Bs83dEcYrnQcHKFMo6",
};
