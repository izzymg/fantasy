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

module.exports = {
    close: () => client.quit(),
    hashSet: (key, object, expiry = null) => new Promise((resolve, reject) => {
        client.hmset(key, object, (error) => {
            if (error) {
                return reject(error);
            }
            if (expiry) {
                client.expire(key, expiry, (error) => {
                    if (error) {
                        return reject(error);
                    }
                    return resolve();
                });
            }
            return resolve();
        });
    }),
    hashGet: (key) => new Promise((resolve, reject) => {
        client.hgetall(key, (error, reply) => {
            if (error) {
                return reject(error);
            }
            return resolve(reply);
        });
    }),
    set: (key, value, expiry = null) => new Promise((resolve, reject) => {
        client.set(key, value, "EX", expiry, (error) => {
            if (error) {
                reject(error);
            }
            resolve();
        });
    }),
    get: (key) => new Promise((resolve, reject) => {
        client.get(key, (error, reply) => {
            if (error) {
                return reject(error);
            }
            return resolve(reply);
        });
    }),
    del: (key) => new Promise((resolve, reject) => {
        client.del(key, (error) => {
            if (error) reject(error);
            return resolve();
        });
    })
};