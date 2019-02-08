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

exports.getSession = function (sessionId) {
    return new Promise((resolve, reject) => {
        client.hgetall(sessionId, (error, reply) => {
            if (error) {
                return reject(error);
            }
            return resolve(reply);
        });
    });
};

exports.setSession = function (sessionId, { username, role }, expiry) {
    return new Promise((resolve, reject) => {
        client.hmset(sessionId, { username, role }, (error) => {
            client.expire(sessionId, expiry, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
            if (error) {
                return reject(error);
            }
        });
    });
};

