const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/private");
const libs = require("../../libs");
let database;
let mem;

exports.start = async() => {
  database = exports.db = mysql.createPool({
    user: secrets.database.user, password: secrets.database.password, 
    host: secrets.database.host, port: secrets.database.port, database: "fantasy",
    connectTimeout: config.database.connectionTimeout,
    connectionLimit: config.database.connectionLimit,
    debug: config.database.debug
  });
  if(config.database.memStore) {
    console.warn(
      "WARNING: Fantasy is configured to use memory instead of Redis.\n \
        This is not safe for production environments and is intended for development only."
    );
    mem = exports.mem = libs.memstore.createClient();
  } else {
    mem = exports.mem = await libs.redis.createClient(secrets.redis);
  }
  return;
};

exports.end = async() => {
  await database.end();
  await mem.close();
  return;
};