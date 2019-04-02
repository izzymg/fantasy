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

describe("posts", function() {
  let threads;

  describe("#getThreads", function() {
    it("should return all threads on board /test/", async function() {
      threads = await models.post.getThreads("test");
      assert(threads && threads.length > 0, "Expected threads returned in array, got " + threads);
    });
  });
  describe("#getThread", function() {
    it("should return a thread on board /test/", async function() {
      const thread = await models.post.getThread("test", threads[0].id);
      assert(thread && thread.id  === threads[0].id, "Expected thread with same ID as first in returned threads array, got " + thread);
    });
  });
  describe("#getThreadReplies", function() {
    it("should return a thread's replies on board /test/", async function() {
      const replies = await models.post.getThreadReplies("test", threads[0].id);
      assert(replies && replies.length > 0, "Expected replies to thread, got " + replies);
    });
  });
  describe("#get", function() {
    it("should return a single post on board /test/", async function() {
      const post = await models.post.get("test", threads[0].id);
      assert(post && post.id == threads[0].id, "Expected single post returned, got " + post);
    });
  });
  describe("#create", function() {
    it("should create a post in the database including a jpg and gif", async function() {
      const jpg = {
        filename: uuid() + ".jpg",
        mimetype: "image/jpeg",
        originalName: "ferrets.jpg",
        size: "666",
        tempPath: path.join(__dirname, "ferrets.jpg"),
      };
      const gif = {
        filename: uuid() + ".gif",
        mimetype: "image/gif",
        originalName: "paperclip_test.jpg",
        size: "777",
        tempPath: path.join(__dirname, "paperclip.gif"),
      };
      const { filesProcessed } = await models.post.create({
        boardUid: "test",
        parent: 0,
        lastBump: new Date(Date.now()),
        name: "Mocha unit test",
        subject: "Test reply",
        content: "This reply was submitted by a unit test",
        ip: "127.0.0.1",
        files: [ jpg, gif ]
      });
      assert(filesProcessed == 2, "Expected 2 processed files, got " + filesProcessed);
    });
  });
  describe("#removeWithReplies", function() {
    it("should remove the post with all replies and files", async function() {
      const { deletedFiles, deletedPosts } = await models.post.removeWithReplies("test", threads[0].id);
      assert(deletedPosts == 2 && deletedFiles == 2, "Got incorrect number of deleted files and posts");
    });
  });
});