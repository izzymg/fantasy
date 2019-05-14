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

describe("Routes: boards", () => {


  // Publically accessible without authentication

  describe("Boards: getAll", () => {
    test("Fetches an array of boards", async() => {
      const response = await request(api.rawHttpServer).get("/boards");
      expect(response.status).toEqual(200);
      expect(response.type).toEqual("application/json");
      expect(response.body).toBeDefined();
      expect(response.body.length).toBeDefined();
    });
  });


  // These should be forbidden without authentication

  describe("Boards: insert", () => {
    test("Fails to insert a board without authentication", async() => {
      const response = await request(api.rawHttpServer).post("/boards");
      expect(response.status).toEqual(403);
    });
  });
  describe("Boards: remove", () => {
    test("Fails to remove a board without authentication", async() => {
      const response = await request(api.rawHttpServer).delete("/boards/test");
      expect(response.status).toEqual(403);
    });
  });

  // Setup admin level authentication before the following

  let cookie;
  const boardUid = crypto.randomBytes(4).toString("hex");

  beforeAll(async() => {
    cookie = await commonTest.createSession(api.rawHttpServer, {
      username: "admin", password: "admin"
    });
    expect(cookie).toBeDefined();
    expect(cookie.length).toBeDefined();
  });

  describe("Boards: insert", () => {
    test("Fails to insert a board with invalid data", async() => {

      // No title or UID
      const response = await
        request(api.rawHttpServer)
          .post("/boards")
          .set("Cookie", cookie)
          .send({ dog: "dog" });
      expect(response.status).toEqual(400);
    });

    test("Successfully inserts a board with authentication and fetches it", async() => {

      // Insert board
      const response = await 
        request(api.rawHttpServer)
          .post("/boards")
          .set("Cookie", cookie)
          .send({ uid: boardUid, title: "Unit test board" });
      expect(response.status).toEqual(200);
      
      // Fetch and assert it's there
      const fetchResponse = await request(api.rawHttpServer).get(`/boards/${boardUid}`);
      expect(fetchResponse.status).toEqual(200);
      expect(fetchResponse.body).toBeDefined();
      expect(fetchResponse.body.title).toEqual("Unit test board");
    });
  });

  describe("Boards: remove", () => {
    test("Successfuly removes a board with authentication", async() => {

      // Delete board
      const response = await
        request(api.rawHttpServer)
        .delete(`/boards/${boardUid}`)
        .set("Cookie", cookie);
      expect(response.status).toEqual(200);

      // Fetch and assert it's *not* there
      const fetchResponse = await request(api.rawHttpServer).get(`/boards/${boardUid}`);
      expect(fetchResponse.status).toEqual(404);
    });
  });
});