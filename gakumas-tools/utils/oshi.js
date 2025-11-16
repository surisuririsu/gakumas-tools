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
      「伊藤舞音のおいでよ まおーこく」だい8かい
    </div>
  ),
  initiallyExpanded: true,
  url: "https://www.youtube.com/watch?v=iQNQIn3C7zk",
};
