import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "gkimg.ris.moe",
        port: "",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
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
      options: {
        isDev: dev,
        isServer,
      },
    });
    return config;
  },
  output: "standalone",
};

export default withNextIntl(nextConfig);
