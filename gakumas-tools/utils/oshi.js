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
      伊藤舞音さんが出演される音楽×百合ドラマ『ステラ・カデンツァ』本日発売です！
    </div>
  ),
  initiallyExpanded: true,
  url: "https://booth.pm/ja/items/7472130",
};
