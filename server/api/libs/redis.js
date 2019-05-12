// Redis promise wrapper

const { promisify, } = require("util");
const redis = require("redis");

exports.createClient = async(url) => {
  const client = redis.createClient({
    url,
    string_numbers: false,
  });
  return {
    close: promisify(client.quit).bind(client),
    del: promisify(client.del).bind(client),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
    ping: promisify(client.ping).bind(client),
  };
};