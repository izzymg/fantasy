const redis = require("redis");
const secretsConfig = require("../config/secrets").redis;
const client = redis.createClient({
    host: secretsConfig.host,
    password: secretsConfig.password,
    port: secretsConfig.port,
    string_numbers: false,
    retry_strategy: function(retry) {
        if(retry.attempt < 2) {
            console.error(retry.error);
        }
        console.log("Redis disconnected, attempting to reconnect in 15s.");
        console.log(`Disconnected for: ${retry.total_retry_time / 1000} seconds`);
        return 15 * 1000;
    }
});

const { promisify } = require("util");

client.on("connect", () => {
    console.log(`Redis connected on ${secretsConfig.host}:${secretsConfig.port}`);
});

client.on("error", error => {
    console.error("Redis failure", error);
    client.quit();
});

client.on("end", () => {
    console.log("Redis disconnecting");
});

module.exports = {
    close: () => client.quit(),
    del: promisify(client.del).bind(client),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
};
