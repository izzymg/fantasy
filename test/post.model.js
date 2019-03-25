const assert = require("assert");
const post = require("../api/models/post");
const connection = require("../api/db/connection");

before(async function() {
  await connection.start();
});

after(async function() {
  await connection.end();
})

describe("post model", function() {
  describe("#getThreads", function() {
    it("should return all threads on board /test/", async function() {
      const thread = await post.getThreads("test");
      assert(thread && thread.length > 0, "Expected threads returned in array");
    });
  });
});