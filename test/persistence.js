// Unit test for persistence layer

const persistence = require("../ends/persistence");
const assert = require("assert");
const crypto = require("crypto");
const config = require("../config/config");
const {
  statSync
} = require("fs");
const path = require("path");

let postId;
let postUid;

describe("Persistence functions", function () {
  describe("#getBoards()", function () {
    it("Should return the boards including /bump/ in an array", async function () {
      const boards = await persistence.getBoards();
      assert(boards.length > 0);
      let bump;
      for (const board of boards) {
        assert(board.url);
        if (board.url == "bump") {
          bump = board.url;
        }
      }
      assert(bump);
    });
  });
  describe("#submitPost()", function () {
    it("Should add a thread to the database with no image on board /bump/, and a reply", async function () {
      const submission = await persistence.submitPost({
        boardUrl: "bump",
        parent: 0,
        name: "Unit Test",
        subject: "Unit testing",
        content: "Post submitted by mocha test",
      });
      assert(submission && typeof submission.postId === "number");
      postId = submission.postId;
      postUid = submission.postUid;
      const reply = await persistence.submitPost({
        boardUrl: "bump",
        parent: postId,
        name: "Reply",
        content: "Reply test",
      });
    });
  });
  describe("#saveFile()", function () {
    it("Should save a file with the post ID of the test thread attached", async function () {
      const id = crypto.randomBytes(4).toString("hex");
      await persistence.saveFile({
        postUid,
        id,
        extension: "png",
        mimetype: "image/png",
        size: 1330,
        originalName: "testfile.png",
        tempPath: __dirname + "/testfile.png"
      }, true, false);
      assert(statSync(path.join(config.posts.filesDir, id + ".png")));
    });
  });
  describe("#bumpPost", function () {
    it("Should bump the thread and return the date", async function () {
      const bumped = await persistence.bumpPost("bump", postId);
      assert((Date.now() - bumped) < 5000);
    });
  });
  describe("#getThread()", function () {
    it("Should return the data of the thread submitted", async function () {
      const thread = await persistence.getThread("bump", postId);
      assert(thread);
      assert(thread.name === "Unit Test");
    });
  });
  describe("#getReplies()", function () {
    it("Should return the replies of the thread submitted", async function () {
      const replies = await persistence.getReplies("bump", postId);
      assert(replies.length === 1);
      assert(replies[0].content === "Reply test");
    });
  });
  describe("#getReplyCount()", function () {
    it("Should return the number of replies in this thread (1)", async function () {
      const replyCount = await persistence.getReplyCount("bump", postId);
      assert(replyCount === 1);
    });
  });
  describe("#getThreadCount()", function () {
    it("Should return the number of threads on the board", async function () {
      const threadsCount = await persistence.getThreadCount("bump");
      assert(typeof threadsCount === "number");
    });
  });
  describe("#getOldestThreadId()", function () {
    it("Should return the ID of thread with the oldest lastBump property", async function () {
      // getThreads orders by lastBump, so last element will be oldest
      const [threads, oldestThreadId] = await Promise.all([
        persistence.getThreads("bump"),
        persistence.getOldestThreadId("bump")
      ]);
      assert(threads[threads.length - 1].id === oldestThreadId);
    });
  });
  describe("#deletePost()", function () {
    it("Should delete the post and its associated files and replies", async function () {
      ;
      const {
        deletedFiles,
        deletedPosts
      } = await persistence.deletePost("bump", postId);
      assert(deletedFiles === 1);
      assert(deletedPosts === 2);
    });
  });
});