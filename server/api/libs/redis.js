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

exports.createClient = async({ host, port, password, }) => {
  let opts = {
    host: host,
    port: port,
    string_numbers: false,
    retry_strategy: function() {
      return 15 * 1000;
    }
  };
  if(password) {
    opts.password = password;
  }
  const client = redis.createClient(opts);
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