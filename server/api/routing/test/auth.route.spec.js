const api = require("../../");
const request = require("supertest");

beforeAll(async() => {
  await api.start();
});

afterAll(async() => {
  await api.end();
});

describe("routes: auth", () => {
  let cookie;
  describe("auth: login", () => {
    test("should successfully login with admin/admin, get a cookie", async() => {
      const login = await
        request(api.rawHttpServer)
        .post("/auth/login")
        .send({ username: "admin", password: "admin" });
      
      expect(login.status).toEqual(200);
      expect(login.headers).toBeDefined();
      expect(login.headers["set-cookie"]).toBeDefined();

      cookie = login.headers["set-cookie"];
    });
  });
  describe("auth: session", () => {
    test("should fetch a session with the returned cookie", async() => {
      const session = await request(api.rawHttpServer)
        .get("/auth/session")
        .set("Cookie", cookie);
      expect(session.status).toEqual(200);
      expect(session.body).toBeDefined();
      expect(session.body.username).toEqual("admin");
    });
    test("should fail to fetch a session with no cookie", async() => {
      const session = await request(api.rawHttpServer).get("/auth/session");
      expect(session.status).toEqual(403);
    });
  });
});