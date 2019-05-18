const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/secrets");
const libs = require("../common/libs");


function createSqlPool() {
  return mysql.createPool(secrets.db_url, config.database);
}

/**
 * Memstore client is a JS object 1-1 fill for needed Redis methods 
*/
function createMemOrRedisClient() {
  return config.noRedis ? libs.memstore.createClient : libs.redis.createClient(secrets.redis_url);
}

let db = createSqlPool();
let mem = createMemOrRedisClient();

/**
 * Reinitializes database and redis or memstore connection 
*/
function restart() {
  db = createSqlPool();
  mem = createMemOrRedisClient();
}

/**
 * Ends database and redis/memstore connections.
 * Resolves on nextTick. 
*/
async function end() {
  await db.end();
  await mem.close();
  await new Promise((resolve) => process.nextTick(resolve));
}

module.exports = {
  db,
  mem,
  restart,
  end,
};