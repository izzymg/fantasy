const assert = require("assert");
const models = require("../api/models");
const connection = require("../api/db/connection");

before(async function() {
  await connection.start();
});

after(async function() {
  await connection.end();
})

describe("models", function() {
  let threads;

  describe("#getThreads", function() {
    it("should return all threads on board /test/", async function() {
      threads = await models.post.getThreads("test");
      assert(threads && threads.length > 0, "Expected threads returned in array");
    });
  });
  describe("#getThread", function() {
    it("should return a thread on board /test/", async function() {
      const thread = await models.post.getThread("test", threads[0].id);
      assert(thread && thread.id  === threads[0].id, "Expected thread with same ID as first in returned threads array");
    });
  });
  describe("#getThreadReplies", function() {
    it("should return a thread's replies on board /test/", async function() {
      const replies = await models.post.getThreadReplies("test", threads[0].id);
      assert(replies && replies.length > 0, "Expected replies to thread");
    });
  });
  describe("#getPost", function() {
    it("should return a single post on board /test/", async function() {
      const post = await models.post.getPost("test", threads[0].id);
      assert(post && post.id == threads[0].id, "Expected single post returned");
    });
  });
});