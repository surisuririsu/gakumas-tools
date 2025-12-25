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
      「MISHIMA LIVE READING PROJECT-Vol.1」
      伊藤舞音さんが出演する1月28日19:00公演のチケット残りわずか！
      <IdolIcon idolId={6} />
    </div>
  ),
  initiallyExpanded: true,
  url: "https://www.confetti-web.com/events/12918",
};
