const api = require("../../");
const request = require("supertest");
const commonTest = require("../../common/test");
const crypto = require("crypto");
const config = require("../../../config/config");

beforeAll(async() => {
  await api.start();
});
    
afterAll(async() => {
  await api.end();
});

describe("Routes: posts", () => {
  describe("posts: insert", () => {
    let testBoard;
    beforeAll(async() => {
      testBoard = await commonTest.createTestBoard(
        { cooldown: 30 }
      );
    });
    afterAll(async() => {
      await testBoard.remove();
    });
    beforeEach(async() => {
      await commonTest.clearCooldowns({ uid: testBoard.uid });
    });
    afterEach(async() => {
      await commonTest.clearCooldowns({ uid: testBoard.uid });
    });
    test("Fails to insert a post without a board parameter", async() => {
      const response = await request(api.rawHttpServer)
        .post("/posts")
        .send({ name: "Anonymous", subject: "Hello", content: "Test" });
      expect(response.status).toEqual(404);
    });
    test("Fails to insert a post with too long a content field", async() => {
      const response = await request(api.rawHttpServer)
        .post(`/posts/${testBoard.uid}`)
        .field("subject", "Test")
        .field("content", crypto.randomBytes(
            config.posts.maxContentLength + 1
          ).toString("hex")
        );
      expect(response.status).toEqual(400);
    });
  });
});