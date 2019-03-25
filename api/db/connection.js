const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/private");
const redis = require("../../libs/redis");
const memstore = require("../../libs/memstore");
let database;
let mem;

exports.start = async() => {
  database = exports.db = mysql.createPool({
    user: secrets.database.user, password: secrets.database.password, 
    host: secrets.database.host, port: secrets.database.port, database: "fantasy",
    connectTimeout: config.database.connectionTimeout,
    connectionLimit: config.database.connectionLimit,
    debug: config.database.debug, trace: config.database.debug
  });
  if(config.database.memStore) {
    mem = exports.mem = memstore.createClient();
  } else {
    mem = exports.mem = await redis.createClient(secrets.redis);
  }
  return;
};

exports.end = async() => await Promise.all([database.end(), mem.close()]);