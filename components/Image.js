import NextImage from "next/image";
import { GH_PAGES_BASE_URL } from "@/utils/data";

export default function Image(props) {
  const unoptimized =
    typeof props.src == "string" && props.src.startsWith(GH_PAGES_BASE_URL);
  return <NextImage {...props} unoptimized={unoptimized} />;
}
