const fs = require("fs");
const sharp = require("sharp");
// Prevent sharp from keeping a lock on the file
sharp.cache(false);
const path = require("path");

exports.writeAppend = async function(file, text) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(path.normalize(file), { flags: "a" }, "utf-8");
    ws.write(text, (error) => {
      if (error) {
        ws.close();
        return reject(`Error writing to log file:\n${error}`);
      }
      ws.close();
      return resolve();
    });
  });
};

exports.createImage = async function(inFilename, outFilename) {
  try {
    await sharp(inFilename).toFile(outFilename);
  } catch(e) {
    throw new Error(e);
  }
};

exports.createThumbnail = async function(inFilename, outFilename, width, quality) {
  try {
    const image = sharp(inFilename);
    const metadata = await image.metadata();
    // Don't resize if image is smaller than a thumbnail
    if (metadata.width > width) {
      await image
        .resize(150)
        .jpeg({ quality: quality, force: true })
        .toFile(outFilename);
    } else {
      await image.jpeg({ quality: quality, force: true }).toFile(outFilename);
    }
  } catch (e) {
    throw new Error(e);
  }
};

exports.unlink = function(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (error) => {
      if (error) return reject(new Error(error));
      resolve();
    });
  });
};

exports.rename = function(path, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(path, newPath, (error) => {
      if (error)return reject(new Error(error));
      resolve();
    });
  });
};

exports.copy = function(path, newPath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(path, newPath, (error) => {
      if(error) return reject(new Error(error));
      resolve();
    });
  });
};
