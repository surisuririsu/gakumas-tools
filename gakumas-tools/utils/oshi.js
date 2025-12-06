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
      「十王星南 生誕ミニライブ2025」
      <IdolIcon idolId={11} />
    </div>
  ),
  videoId: "JN74QXOJQaA",
};
