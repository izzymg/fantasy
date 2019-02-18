// Redis promise wrapper

const { promisify } = require("util");
const redis = require("redis");

function waitConnect(client) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject("Redis connection timedout"), 15000);
    client.on("connect", () => {
      resolve();
    });
  }); 
}

exports.createClient = async ({ host, port, password, }) => {
  console.log(`Starting redis connection on ${host}:${port}`);
  let opts = {
    host: host,
    port: port,
    string_numbers: false,
    retry_strategy: function(retry) {
      if(retry.attempt < 2) {
        console.error(retry.error);
      }
      console.log("Redis disconnected, attempting to reconnect in 15s.");
      console.log(`Disconnected for: ${retry.total_retry_time / 1000} seconds`);
      return 15 * 1000;
    }
  };
  if(password) {
    opts.password = password;
  }
  const client = redis.createClient(opts);
  const close = promisify(client.quit).bind(client);
        
  client.on("error", error => {
    client.quit();
    throw "Redis failure", error;
  });
        
  client.on("quit", () => console.log("Redis disconnecting"));
  client.on("connect", () => console.log(`Redis connected on ${host}:${port}`));

  await waitConnect(client);
  return {
    close: async () => {
      console.log("Closing redis connection");
      return await close();
    },
    del: promisify(client.del).bind(client),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
  };
};