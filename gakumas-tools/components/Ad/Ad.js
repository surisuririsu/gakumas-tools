import { useMemo } from "react";
import KofiAd from "./KofiAd";
import ContestWikiAd from "./ContestWikiAd";

const ADS = [KofiAd, KofiAd, KofiAd, ContestWikiAd];

export default function Ad() {
  const AdComponent = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    []
  );
  return <AdComponent />;
}
