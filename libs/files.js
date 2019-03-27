const fs = require("fs");
const { promisify } = require("util");
const sharp = require("sharp");
const path = require("path");

// Prevent sharp from keeping a lock on the file
sharp.cache(false);

const fsCopyFile = promisify(fs.copyFile);

async function createThumbnail(inFp, outputFp, width, quality) {
  const image = sharp(inFp);
  const metadata = await image.metadata();
  // Transform filepath into (dir)/thumb-(fileid).jpg
  const basename = path.basename(outputFp);
  const thumbOutFp = path.join(
    path.dirname(outputFp),
    "thumb-" + basename.slice(0, basename.indexOf(".")) + ".jpg"
  );
  // Don't resize if image is smaller than a thumbnail
  if (metadata.width > width) {
    await image
      .resize(150)
      .jpeg({ quality: quality, force: true })
      .toFile(thumbOutFp);
  } else {
    await image.jpeg({ quality: quality, force: true }).toFile(thumbOutFp);
  }
}

async function processPostFile(tempFp, outputFp, thumbOutputFp, mimetype,
  { thumbWidth, thumbQuality } = { thumbWidth: 150, thumbQuality: 40 }) {
  switch(mimetype) {
    // Process image and thumbnail through sharp
    case ("image/jpeg" || "image/png"):
      await Promise.all([
        sharp(tempFp).toFile(outputFp),
        createThumbnail(tempFp, thumbOutputFp, thumbWidth, thumbQuality)
      ]);
      break;
    // Don't process full size gifs through sharp, but make thumb
    case ("image/gif"):
      await Promise.all([
        fsCopyFile(tempFp, outputFp),
        createThumbnail(tempFp, thumbOutputFp, thumbWidth, thumbQuality)
      ]);
      break;
    default:
      throw new Error("Unhandled mimetype");
  }
}

exports.processPostFile = processPostFile;
exports.unlink = promisify(fs.unlink);