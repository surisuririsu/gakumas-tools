// This file is aliased at build time (see next.config.mjs). When
// NEXT_PUBLIC_GK_IMG_BASE_URL is set, gakumas-images resolves to ./remote.js
// and returns CDN URLs. When unset, it resolves to ./bundled.js and returns
// webpack-emitted static asset paths so the fork ships its own images.
export { default, isGkImgUrl } from "./remote.js";
