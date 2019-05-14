const api = require("../../");
const request = require("supertest");
const models = require("../../models");

beforeAll(async() => {
  await api.start();
});

afterAll(async() => {
  await api.end();
});

describe("Routes: auth", () => {
  let cookie;
  describe("Auth: login", () => {
    // Reset IP attempts
    beforeAll(async() => {
      await models.ip.setLogins("127.0.0.1", 0, new Date(Date.now()));
    });
    afterAll(async() => {
      await models.ip.setLogins("127.0.0.1", 0, new Date(Date.now()));
    });
    test("Successfully logins in, gets a cookie", async() => {
      const login = await
        request(api.rawHttpServer)
        .post("/auth/login")
        .send({ username: "admin", password: "admin" });
      
      expect(login.status).toEqual(200);
      expect(login.headers).toBeDefined();
      expect(login.headers["set-cookie"]).toBeDefined();

      cookie = login.headers["set-cookie"];
    });
    test("Locks IP out on 6th attempt", async() => {
      for(let i = 0; i <= 5; i++) {
        const login = await request(api.rawHttpServer)
          .post("/auth/login")
          .send({ username: "b", password: "a" });
        if(i == 5) {
          expect(login.status).toEqual(429);
        } else {
          console.log(i);
          expect(login.status).toEqual(403);
        }
      }
    });
  });
  describe("Auth: session", () => {
    test("Fetches a session with the returned cookie", async() => {
      const session = await request(api.rawHttpServer)
        .get("/auth/session")
        .set("Cookie", cookie);
      expect(session.status).toEqual(200);
      expect(session.body).toBeDefined();
      expect(session.body.username).toEqual("admin");
    });
    test("Fails to fetch a session with no cookie", async() => {
      const session = await request(api.rawHttpServer).get("/auth/session");
      expect(session.status).toEqual(403);
    });
  });
});