const connection = require("../connection");

describe("DB: connection", () => {
  test("DB and redis/mem connections establish and are pingable", async() => {
    let conn;
    try {
      await connection.start();
      expect(connection.db).not.toBeNull();
      expect(connection.mem).not.toBeNull();
  
      // Get one connection off pool to ping
      conn = await connection.db.getConnection();
      await conn.ping();
      // Ping redis
      await connection.mem.ping();
    } catch(error) {
      throw error; 
    } finally {
      if(conn) {
        conn.release();
      }
      connection.end();
    }
  });
});