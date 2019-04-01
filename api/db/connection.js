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
    mem = exports.mem = libs.memstore.createClient();
  } else {
    mem = exports.mem = await libs.redis.createClient(secrets.redis);
  }
  return;
};

exports.end = async() => await Promise.all([database.end(), mem.close()]);