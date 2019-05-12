const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/secrets");
const libs = require("../libs");
let _database;
let _mem;

exports.start = async() => {
  _database = exports.db = mysql.createPool(secrets.db_url, config.database);
  if(config.noRedis) {
    console.warn(
      "WARNING: Fantasy is configured to use memory instead of Redis.\n \
        This is not safe for production environments and is intended for development only."
    );
    _mem = exports.mem = libs.memstore.createClient();
  } else {
    _mem = exports.mem = await libs.redis.createClient(secrets.redis_url);
  }
  return;
};

exports.end = async() => {
  if(_database) {
    await _database.end();
  }
  if(_mem) {
    await _mem.close();
  }
};