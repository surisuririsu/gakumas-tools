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
      『伊藤舞音と浅見香月のおかづラジオ』#11ゲストは天音ゆかりさん
      <IdolIcon idolId={13} />
      <br />
      全編無料で視聴できます！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://nicochannel.jp/okazuradio/video/smmRyqszeP2Pxm6mA4HRHHEG",
};
