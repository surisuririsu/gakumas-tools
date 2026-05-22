import path from "path";
import { createRequire } from "module";
import createNextIntlPlugin from "next-intl/plugin";

const require = createRequire(import.meta.url);
const withNextIntl = createNextIntlPlugin();

const LEGACY_REDIRECTS = [
  ["/produce-rank-calculator", "/calculator/hif"],
  ["/lesson-calculator", "/calculator/hajime/lesson"],
  ["/calculator", "/calculator/hif"],
  ["/calculator/hajime", "/calculator/hajime/produce-rank"],
];

const LOCALE_PREFIXES = ["", "/en", "/zh-Hans", "/ko"];

const gkImgBaseUrl = process.env.NEXT_PUBLIC_GK_IMG_BASE_URL;
const gkImgHostname = gkImgBaseUrl && new URL(gkImgBaseUrl).hostname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com", port: "" },
      ...(gkImgHostname
        ? [{ protocol: "https", hostname: gkImgHostname, port: "" }]
        : []),
    ],
  },
  async redirects() {
    return LEGACY_REDIRECTS.flatMap(([from, to]) =>
      LOCALE_PREFIXES.map((prefix) => ({
        source: `${prefix}${from}`,
        destination: `${prefix}${to}`,
        permanent: true,
      }))
    );
  },
  // When NEXT_PUBLIC_GK_IMG_BASE_URL is set, resolve gakumas-images to its
  // remote entry — CDN URLs only, no image files bundled. When unset (fork
  // default), resolve to the bundled entry and register a file-emitting
  // loader so webpack turns each imported image into a /_next/static/media/
  // asset.
  webpack: (config, { dev, isServer }) => {
    const entry = gkImgBaseUrl ? "remote.js" : "bundled.js";
    config.resolve.alias = {
      ...config.resolve.alias,
      "gakumas-images$": require.resolve(`gakumas-images/${entry}`),
    };

    if (!gkImgBaseUrl) {
      config.module.rules = config.module.rules.filter(
        (c) => c.loader != "next-image-loader"
      );
      config.module.rules.push({
        test: /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i,
        loader: path.resolve("loaders/imageLoader.js"),
        issuer: { not: /\.(css|scss|sass)$/ },
        dependency: { not: ["url"] },
        resourceQuery: {
          not: [
            new RegExp("__next_metadata__"),
            new RegExp("__next_metadata_route__"),
            new RegExp("__next_metadata_image_meta__"),
          ],
        },
        options: { isDev: dev, isServer },
      });
    }
    return config;
  },
  output: "standalone",
};

export default withNextIntl(nextConfig);
