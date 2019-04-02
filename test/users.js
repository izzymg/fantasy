const assert = require("assert");
const models = require("../api/models");
const connection = require("../api/db/connection");

before(async function() {
  await connection.start();
});

after(async function() {
  await connection.end();
})

describe("users", function() {
  describe("#isAdmin", function() {
    it("should return true for user 'admin', false for 'dog'", async function() {
      const [adminIsAdmin, dogIsAdmin] = await Promise.all([
        models.user.isAdmin("admin"),
        models.user.isAdmin("dog"),
      ]);
      assert(adminIsAdmin === true, "Expected adminIsAdmin === true, got " + adminIsAdmin);
      assert(dogIsAdmin === false, "Expected dogIsAdmin === false, got " + dogIsAdmin);
    });
  });
});