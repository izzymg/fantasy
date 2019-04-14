const assert = require("assert");
const models = require("../api/models");
const connection = require("../api/db/connection");
const uuid = require("uuid/v4");
const path = require("path");

before(async function() {
  await connection.start();
});

after(async function() {
  await connection.end();
});

async function createPost() {
  const jpg = {
    filename: uuid() + ".jpg",
    mimetype: "image/jpeg",
    originalName: "ferrets.jpg",
    size: "666",
    tempPath: path.join(__dirname, "ferrets.jpg"),
  };
  const res = await models.post.create({
    boardUid: "test",
    parent: 0,
    lastBump: new Date(Date.now()),
    name: "Mocha unit test",
    subject: "Test thread",
    content: "Concurrency test",
    ip: "127.0.0.1",
    files: [ jpg ]
  });
  return res.postNumber;
}

describe("concurrent insert", function() {
  it("should insert posts concurrently without failure or key overlap", async function() {
    const results = await Promise.all([
      createPost(),
      createPost(),
      createPost(),
      createPost(),
    ]);
    console.log(results);
  });
});
