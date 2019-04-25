const post = require("../../api/models/post");
const conn = require("../../api/db/connection");
const os = require("os");
const path = require("path");
const uuid = require("uuid/v4");
const fs = require("fs");
const fsAccess = require("util").promisify(fs.access);

const config = require("../../config/config");
const filesDir = config.posts.filesDir;
const thumbsDir = config.posts.thumbsDir;

before(async function() {
  await conn.start();
});

after(async function() {
  await conn.end();
});

describe("Insert GIF", function() {
  it("Should create a gif + thumbnail", async function() {
    const filename = uuid() + ".gif";
    await post.insertFile(1, path.join(os.homedir(), "Pictures/GifTest.gif"), {
      filename,
      mimetype: "image/gif",
      originalName: "業福気画.gif",
      size: 154378,
    });
    await fsAccess(
      path.join(filesDir, filename), fs.constants.R_OK
    );
    await fsAccess(
      path.join(thumbsDir, filename), fs.constants.R_OK
    );
  });
});

describe("Insert PNG", function() {
  it("Should create a PNG + thumbnail", async function() {
    const filename = uuid() + ".png";
    await post.insertFile(1, path.join(os.homedir(), "Pictures/PngTest.png"), {
      filename,
      mimetype: "image/png",
      originalName: "ラヲ公検ネ.png",
      size: 154378,
    });
    await fsAccess(
      path.join(filesDir, filename), fs.constants.R_OK
    );
    await fsAccess(
      path.join(thumbsDir, filename), fs.constants.R_OK
    );
  });
});

describe("Insert JPEG", function() {
  it("Should create a JPEG + thumbnail", async function() {
    const filename = uuid() + ".jpeg";
    await post.insertFile(1, path.join(os.homedir(), "Pictures/JpegTest.jpg"), {
      filename,
      mimetype: "image/jpeg",
      originalName: "JpegTest اتفاقية.jpg",
      size: 154378,
    });
    await fsAccess(
      path.join(filesDir, filename), fs.constants.R_OK
    );
    await fsAccess(
      path.join(thumbsDir, filename), fs.constants.R_OK
    );
  });
});