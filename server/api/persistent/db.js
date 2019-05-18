const mysql = require("mysql2/promise");
const config = require("../../config/config");
const secrets = require("../../config/secrets");
const libs = require("../common/libs");


function createSqlPool() {
  return mysql.createPool(secrets.db_url, config.database);
}

function createRedisClient() {
  return libs.redis.createClient(secrets.redis_url);
}

let sql = createSqlPool();
let redis = createRedisClient();

/**
 * Reinitializes sql and redis connection 
*/
function restart() {
  sql = createSqlPool();
  redis = createRedisClient();
}

/**
 * Ends database and redis connections.
 * Resolves on nextTick. 
*/
async function end() {
  await sql.end();
  await redis.close();
  await new Promise((resolve) => process.nextTick(resolve));
}

module.exports = {
  sql,
  redis,
  restart,
  end,
};