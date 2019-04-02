const assert = require("assert");
const models = require("../api/models");
const connection = require("../api/db/connection");

before(async function() {
  await connection.start();
});

after(async function() {
  await connection.end();
})

describe("boards", function() {
  describe("#get", function() {
    it("should return a single board by uid 'test'", async function() {
      const board = await models.board.get("test");
      assert(board && board.uid == "test", "Expected board returned, got " + board);
    });
  });
  describe("#getAll", function() {
    it("should return all boards in an array", async function() {
      const boards = await models.board.getAll();
      assert(boards && boards.length > 0, "Expected boards returned in an array, got " + boards);
    });
  });
});