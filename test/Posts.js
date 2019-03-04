const persistence = require("../db/persistence");
const Posts = require("../db/Posts");
const assert = require("assert");

before(async function () {
  await persistence.initialize();
});

after(async function () {
  await persistence.end();
});

describe("#savePost", function () {
  it("Should save a post to the database with two files", async function () {

    const file = Posts.File({
      tempPath: __dirname + "/testfile.png",
      filename: Date.now() + "_test.png",
      thumbFilename: Date.now() + "_test_thumb.jpg",
      size: 0,
      originalName: "TestFile"
    }, { fresh: true });

    const filetwo = Posts.File({
      tempPath: __dirname + "/testfile2.png",
      filename: Date.now() + "_test2.png",
      thumbFilename: Date.now() + "_test2_thumb.jpg",
      size: 0,
      originalName: "TestFile2"
    }, { fresh: true });

    const { processedFiles } = await Posts.savePost(Posts.Post({
      boardUrl: "test",
      name: "Unit testing",
      subject: "Test thread, please ignore!",
      content: "This is a test thread",
      files: [file, filetwo],
      },
    { fresh: true }));
    assert(processedFiles == 2, "Processed file count was unexpected: " + processedFiles);
  });
});

let testPostId;

describe("#getThreads", function() {
  it("Should get the threads from the board in an array", async function() {
    
    const threads = await Posts.getThreads("test");

    assert(threads.length == 1, "Threads length was unexpected length: " + threads.length);
    assert(threads[0].name = "Unit testing", "Thread contained unexpected name: " + threads[0].name);
    assert(
      threads[0].files[0].thumbFilename.indexOf("_test") !== -1, 
      "Thread contained unexpected thumbnail filename: " + threads[0].files[1].thumbFilename
    );
    testPostId = threads[0].id;
  });
});

describe("#deletePost", function() {
  it("Should delete the test post", async function() {
    const { deletedFiles, deletedPosts } = await Posts.deletePost("test", testPostId);
    assert(deletedPosts == 1, "Deleted posts count was unexpected: " + deletedPosts);
    assert(deletedFiles == 2, "Deleted files count was unexpected: " + deletedFiles);
  });
})