import NextImage from "next/image";
import { isGkImgUrl } from "gakumas-images";

export default function Image(props) {
  const unoptimized = isGkImgUrl(props.src);
  return <NextImage {...props} unoptimized={unoptimized} />;
}
