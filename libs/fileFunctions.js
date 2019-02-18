const fs = require("fs");
const sharp = require("sharp");
// Prevent sharp from keeping a lock on the file
sharp.cache(false);
const path = require("path");
const uuid = require("uuid/v4");

const fileSignatures = {
  "89504E470D0A1A0A": "image/png",
  // There are two potential accepted gif types
  "474946383761": "image/gif",
  "474946383961": "image/gif",
  "FFD8": "image/jpeg",
};

const extensions = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
};

// Creates temporary file and returns mimetype and filesize
exports.processFile = function(readStream, tempDir) {
  return new Promise((resolve, reject) => {
    const fileId = uuid();
    const tempPath = path.join(tempDir, fileId);
    const tempStream = fs.createWriteStream(tempPath);
    let mimetype;
    let extension;
    function cleanup() {
      readStream.unpipe(tempStream);
      tempStream.end();
    }
    function readMime(chunk) {
      // Remove listener once called once
      readStream.removeListener("data", readMime);
      const chunkString = chunk.toString("hex");
      for (const sig in fileSignatures) {
        if(sig === chunkString.slice(0, sig.length).toUpperCase()) {
          // Signature found in data chunk
          mimetype = fileSignatures[sig];
          extension = extensions[mimetype];
          return;          
        }
      }
      cleanup();
      return reject({ status: 400, message: "Invalid mimetype." });
    }
    readStream.pipe(tempStream);
    readStream.on("data", readMime);
    readStream.on("error", (error) => {
      cleanup();
      return reject(error);
    });
    readStream.on("end", () => {
      cleanup();
      return resolve({ fileId, mimetype, extension, size: tempStream.bytesWritten, tempPath });
    });
  });
};

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
  } catch (e) {
    throw new Error(e);
  }
};

exports.unlink = function(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (error) => {
      console.log("Unlinking", path);
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
