// Image processing functions

const fs = require("fs");
const util = require("util");
const path = require("path");
const sharp = require("sharp");

const fsCopy = util.promisify(fs.copyFile);

let _opts = {
  filesDirectory: null,
  thumbsDirectory: null,
  thumbWidth: 150,
  thumbQuality: 40,
};

async function cpy(inputFilepath, outputFilepath) {
  await fsCopy(inputFilepath, outputFilepath);
}

async function img(inputFilepath, outputFilepath) {
  await sharp(inputFilepath).toFile(outputFilepath);
}

async function thumb(inputFilepath, outputFilepath) {
  const image = sharp(inputFilepath);
  const metadata = await image.metadata();
  // Don't resize if image is smaller than a thumbnail
  if (metadata.width > _opts.thumbWidth) {
    await image
      .resize(150)
      .jpeg({ quality: _opts.thumbQuality, force: true, })
      .toFile(outputFilepath);
  } else {
    await image
      .jpeg({ quality: _opts.thumbQuality, force: true, })
      .toFile(outputFilepath);
  }
}

/**
 * Processes and writes out files based on their mimetype
 * @param {*} tempFilepath Location where the file is stored
 * @param {*} filename Filename to be used in the output
 * @param {*} mimetype Trusted mimetype of the file
*/
async function writeFile(tempFilepath, filename, mimetype) {
  const fileOut = path.join(_opts.filesDirectory, filename);
  const thumbOut = path.join(_opts.thumbsDirectory, filename);

  // Gifs aren't run through Sharp processing
  // But still thumbnailed by sharp

  switch(mimetype) {
    case "image/png":
    case "image/jpeg":
      await Promise.all([
        img(tempFilepath, fileOut),
        thumb(tempFilepath, thumbOut)
      ]);
      break;
    case "image/gif":
      await Promise.all([
        cpy(tempFilepath, fileOut),
        thumb(tempFilepath, thumbOut)
      ]);
      break;
    default:
      throw new Error("Invalid mimetype");
  }
}

/**
 * Intializes imager and returns a file processing function 
*/
module.exports = function({
  filesDirectory,
  thumbsDirectory,
  thumbWidth,
  thumbQuality,
}) {
  _opts.filesDirectory = filesDirectory;
  _opts.thumbsDirectory = thumbsDirectory;
  if(thumbWidth !== undefined) {
    _opts.thumbWidth = thumbWidth;
  }
  if(thumbQuality !== undefined) {
    _opts.thumbQuality = thumbQuality;
  }
  return writeFile;
};