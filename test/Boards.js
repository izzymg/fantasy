const persistence = require("../db/persistence");
const Boards = require("../db/boards");
const assert = require("assert");

before(async function () {
  await persistence.initialize();
});

after(async function () {
  await persistence.end();
});

describe("#getBoards", function() {
  it("Should fetch a list of boards containing /test/", async function() {
    const boards = await Boards.getBoards();
    assert(boards.length == 1, "Unexpected boards length: " + boards.length);
    assert(boards[0].url == "test", "Unexpected board url: " + boards[0].url);
  });
});