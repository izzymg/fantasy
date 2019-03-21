// Singleton exports for redis/sql access

const memstore = require("../../libs/memstore");
const sql = require("../../libs/sql");
const redis = require("../../libs/redis");
const config = require("../../config/config");
const secrets = require("../../config/private");
let database;
let mem;

exports.start = async() => {
  database = exports.db = sql.createPool(secrets.database, config.database);
  if(config.database.memStore) {
    mem = exports.mem = memstore.createClient();
  } else {
    mem = exports.mem = await redis.createClient(secrets.redis);
  }
  return;
};

exports.end = async() => await Promise.all([database.end(), mem.close()]);