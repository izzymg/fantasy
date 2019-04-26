// Redis promise wrapper

const { promisify, } = require("util");
const redis = require("redis");

function waitConnect(client) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject("Redis connection timedout"), 15000);
    client.on("connect", () => {
      resolve();
    });
  }); 
}

exports.createClient = async(url) => {
  const client = redis.createClient({
    url,
    string_numbers: false,
  });
  const close = promisify(client.quit).bind(client);
        
  client.on("error", (error) => {
    client.quit();
    throw "Redis failure", error;
  });
        
  await waitConnect(client);
  return {
    close: async() => await close(),
    del: promisify(client.del).bind(client),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
  };
};