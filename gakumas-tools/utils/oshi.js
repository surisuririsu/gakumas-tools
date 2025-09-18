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
  text: "9.20→21「クラス対抗初星大運動会」配信チケット発売中！",
  initiallyExpanded: true,
  url: "https://asobistage.asobistore.jp/event/gakuen_gkmas_undokai/ticket",
};
