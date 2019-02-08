const redis = require("redis");
const secretsConfig = require("../config/secrets").redis;
const client = redis.createClient({
    host: secretsConfig.host,
    password: secretsConfig.password,
    port: secretsConfig.port
});

const { promisify } = require("util");

client.on("connect", () => {
    console.log(`Redis connected on ${secretsConfig.host}:${secretsConfig.port}`);
});

client.on("error", (error) => {
    console.error("Redis failure", error);
    client.quit();
});

client.on("end", () => {
    console.log("Redis disconnecting");
});

module.exports = {
    close: () => client.quit(),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
};