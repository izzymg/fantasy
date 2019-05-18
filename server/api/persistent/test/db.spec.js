const connection = require("../db");

describe("DB: connection", () => {
  test("DB and redis/mem connections establish and are pingable", async() => {
    let conn;
    try {
      expect(connection.sql).not.toBeNull();
      expect(connection.mem).not.toBeNull();
  
      // Get one connection off pool to ping
      conn = await connection.sql.getConnection();
      await conn.ping();
      // Ping redis
      await connection.mem.ping();
    } catch(error) {
      throw error; 
    } finally {
      if(conn) {
        conn.release();
      }
      await connection.end();
    }
  });
});