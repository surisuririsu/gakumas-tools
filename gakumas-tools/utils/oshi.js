import { Idols } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";

const IdolIcon = ({ idolId }) => {
  const idol = Idols.getById(idolId);
  return (
    <Image src={gkImg(idol).icon} width={24} height={24} draggable={false} />
  );
};

export const OSHI_PROPS = {
  text: (
    <>
      「初星学園放送部 #49」を聴きましょう！
      <IdolIcon idolId={6} />
      <IdolIcon idolId={10} />
    </>
  ),
  url: "https://asobichannel.asobistore.jp/watch/9f01driiwg2",
};

// {
//   text: "初星学園放送部 #49",
//   initiallyExpanded: true,
//   type: "asobiChannel",
//   videoId: "f2c1417b",
// }
// export const OSHI_PROPS = {
//   text: "倉本千奈 生誕ミニライブ2025",
//   initiallyExpanded: true,
//   type: "youtube",
//   videoId: "CD93hMXh6Yc",
// };
