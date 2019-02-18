const fs = require("fs");
const sharp = require("sharp");
const path = require("path");

exports.writeAppend = async function(file, text) {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(path.normalize(file), { flags: "a" }, "utf-8");
    ws.write(text, error => {
      if (error) {
        ws.close();
        return reject(`Error writing to log file:\n${error}`);
      }
      ws.close();
      return resolve();
    });
  });
};

exports.createThumbnail = async function(inFilename, outFilename, width) {
  try {
    const image = sharp(inFilename);
    const metadata = await image.metadata();
    // Don't resize if image is smaller than a thumbnail
    if (metadata.width > width) {
      await image
        .resize(150)
        .toFormat("jpeg")
        .toFile(outFilename);
    } else {
      await image.toFormat("jpeg").toFile(outFilename);
    }
    image.end();
  } catch (e) {
    throw new Error(e);
  }
};

exports.unlink = function(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, error => {
      if (error) return reject(new Error(error));
      resolve();
    });
  });
};

exports.rename = function(path, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(path, newPath, error => {
      if (error)return reject(new Error(error));
      resolve();
    });
  });
};

exports.copy = function(path, newPath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(path, newPath, error => {
      if(error) return reject(new Error(error));
      resolve();
    });
  });
};
