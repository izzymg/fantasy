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

describe("routes: boards", () => {

  describe("public requests:", () => {

    // Publically accessible without authentication

    describe("boards: getAll", () => {

      test("fetches an array of boards", async() => {
        const response = await request(api.rawHttpServer).get("/boards");
        expect(response.status).toEqual(200);
        expect(response.type).toEqual("application/json");
        expect(response.body).toBeDefined();
        expect(response.body.length).toBeDefined();
      });
    });
  });

  describe("unauthenticated requests:", () => {

    // These should be forbidden without authentication

    describe("boards: insert", () => {
      test("insert a board", async() => {
        const response = await request(api.rawHttpServer).post("/boards");
        expect(response.status).toEqual(403);
      });
    });
    describe("boards: remove", () => {
      test("remove a board", async() => {
        const response = await request(api.rawHttpServer).delete("/boards/test");
        expect(response.status).toEqual(403);
      });
    });
  });
  describe("authenticated requests:", () => {

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

    describe("boards: insert", () => {
      test("insert a board with invalid data", async() => {

        // No title or UID
        const response = await
          request(api.rawHttpServer)
            .post("/boards")
            .set("Cookie", cookie)
            .send({ dog: "dog" });
        expect(response.status).toEqual(400);
      });

      test("insert a board and fetch it", async() => {

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

    describe("boards: remove", () => {
      test("remove a board", async() => {

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
});