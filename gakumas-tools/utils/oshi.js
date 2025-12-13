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
      『THE IDOLM@STER M@STERS OF IDOL WORLD 2025』配信チケット販売中
      <br />
      <IdolIcon idolId={6} />
      倉本千奈ちゃんはDAY2に出演します！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://asobistage.asobistore.jp/event/idolmaster_idolworld2025/ticket",
};
