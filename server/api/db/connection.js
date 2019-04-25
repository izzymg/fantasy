const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/private");
const libs = require("../libs");
let _database;
let _mem;

exports.start = async() => {
  _database = exports.db = mysql.createPool(secrets.database);
  if(config.database.pingOnStart) {
    const conn = await _database.getConnection();
    await conn.ping();
  }
  if(config.database.memStore) {
    console.warn(
      "WARNING: Fantasy is configured to use memory instead of Redis.\n \
        This is not safe for production environments and is intended for development only."
    );
    _mem = exports.mem = libs.memstore.createClient();
  } else {
    _mem = exports.mem = await libs.redis.createClient(secrets.redis);
  }
  return;
};

exports.end = async() => {
  await _database.end();
  await _mem.close();
  return;
};