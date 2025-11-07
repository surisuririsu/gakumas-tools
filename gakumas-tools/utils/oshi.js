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
      おかづラジオ×アイラハルカの「ないしょ話」第1回は伊藤舞音さん
      <IdolIcon idolId={6} />
    </div>
  ),
  url: "https://gs-ch.com/articles/contents/araHJnnfHbW5uwugcfxtXs7g",
  initiallyExpanded: true,
};
