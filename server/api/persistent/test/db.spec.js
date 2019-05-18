const db = require("../db");

describe("DB: connection", () => {
  test("DB and redis/mem connections establish and are pingable", async() => {
    let conn;
    try {
      expect(db.sql).not.toBeNull();
      expect(db.redis).not.toBeNull();
  
      // Get one connection off pool to ping
      conn = await db.sql.getConnection();
      await conn.ping();
      // Ping redis
      await db.redis.ping();
    } catch(error) {
      throw error; 
    } finally {
      if(conn) {
        conn.release();
      }
      await db.end();
    }
  });
});