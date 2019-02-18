const sql = require("../libs/sql");
const config = require("../config/config");
const secrets = require("../config/private");
const database = sql.createPool(secrets.database, config.database);
const assert = require("assert");

describe("Constraints", function () {
  after(async function () {
    await database.end();
    return;
  });
  describe("Insert a post with a non existent board", function () {
    it("Should refuse the query due to the foreign key constraint", async function () {
      try {
        await database.query({
          sql: "INSERT INTO posts SET ?",
          values: [{
            boardUrl: "IdontExisTiHope",
            postId: 13242,
            parent: 0
          }]
        });
      } catch (error) {
        assert(error.errno === 1452);
      }
    });
  });
  describe("Insert a file with a non existent post UID", function () {
    it("Should refuse the query due to the foreign key constraint", async function () {
      try {
        await database.query({
          sql: "INSERT INTO files SET ?",
          values: [{
            fileId: "a-fake-test-file",
            extension: "png",
            postUid: 123
          }]
        });
      } catch(error) {
        assert(error.errno === 1452);
      }
    });
  });
  describe("Insert a board ID row with an invalid board", function() {
    it("Should refuse the query due to the foreign key constraint", async function() {
      try {
        await database.query({
          sql: "INSERT INTO boardids SET ?",
          values: [{ boardUrl: "notExist", id: 0 }]
        })
      } catch (error) {
        assert(error.errno === 1452);
      }
    });
  });
});