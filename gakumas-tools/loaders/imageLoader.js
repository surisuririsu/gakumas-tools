const path = require("path");
const imageSizeOf = require("next/dist/compiled/image-size");
const loaderUtils = require("next/dist/compiled/loader-utils3");

function getImageSize(buffer) {
  const { width, height } = imageSizeOf(buffer);
  return { width, height };
}

function nextImageLoader(content) {
  const { isDev, isServer } = this.getOptions();
  const context = this.rootContext;

  const opts = { context, content };
  const interpolatedName = loaderUtils.interpolateName(
    this,
    "/static/media/[name].[hash:8].[ext]",
    opts
  );
  const outputPath = "/_next" + interpolatedName;
  let extension = loaderUtils.interpolateName(this, "[ext]", opts);
  if (extension === "jpg") extension = "jpeg";

  const imageSize = getImageSize(content);
  const stringifiedData = JSON.stringify({
    src: outputPath,
    height: imageSize.height,
    width: imageSize.width,
  });

  const filePath = isServer
    ? path.join(isDev ? "" : "..", "..", interpolatedName)
    : interpolatedName;
  this.emitFile(filePath, content, null);

  return `export default ${stringifiedData};`;
}

module.exports = {
  default: nextImageLoader,
  raw: true,
};
