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
    <>
      「初星学園放送部 #61」を聴きましょう！
      <IdolIcon idolId={6} />
    </>
  ),
  initiallyExpanded: true,
  url: "https://asobichannel.asobistore.jp/watch/nevm9w5s96vn",
};
