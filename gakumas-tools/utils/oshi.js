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
      <IdolIcon idolId={8} />
      川村玲奈の「ウラめしや Kawamura」
      <br />
      初回ゲストは伊藤舞音さん
      <IdolIcon idolId={6} />
    </div>
  ),
  initiallyExpanded: true,
  url: "https://nicochannel.jp/kawamura/live/sm3h5SGaesj2UHrdxc7hjYxU",
};
