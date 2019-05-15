const api = require("../../");
const request = require("supertest");
const commonTest = require("../../common/test");
const crypto = require("crypto");

beforeAll(async() => {
  await api.start();
});
    
afterAll(async() => {
  await api.end();
});

describe("Routes: posts", () => {
  describe("posts: insert", () => {
    test("Fails to insert a post without a board parameter", async() => {
      const response = await request(api.rawHttpServer)
        .post("/posts")
        .send({ name: "Anonymous", subject: "Hello", content: "Test" });
      expect(response.status).toEqual(404);
    });
  });
});