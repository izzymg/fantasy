const redis = require("redis");
const secretsConfig = require("../config/secrets").redis;
const client = redis.createClient({
    host: secretsConfig.host,
    password: secretsConfig.password,
    port: secretsConfig.port
});

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

module.exports = client;