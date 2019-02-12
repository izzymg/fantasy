const redis = require("redis");
const { promisify } = require("util");
const secretsConfig = require("../config/private").redis;
const databaseConfig = require("../config/config").database;
let client;
if(databaseConfig.memStore) {
    client = {};
    console.warn(
        `WARNING: Server is configured to use memory instead of Redis.
        This is not safe for production environments and is intended for development only.`
    );
} else {
    client = redis.createClient({
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
}

module.exports = databaseConfig.memStore ? {
    close: () => client = null,
    del: key => {
        if(client[key]) {
            client[key] = null;
            return 1;
        }
        return 0;
    },
    hDel: (key, field) => {
        if(client[key][field]) {
            client[key][field] = null;
            return 1;
        }
        return 0;
    },
    hGet: (key, field) => client[key] ? client[key][field] : null,
    hSet: (key, field, val) => {
        if(client[key]) {
            client[key][field] = val;
        } else {
            client[key] = {};
            client[key][field] = val;
        }
    },
    expire: (key, seconds) => setTimeout(() => client[key] = null, seconds * 1000)
} : {
    close: () => client.quit(),
    del: promisify(client.del).bind(client),
    hDel: promisify(client.hdel).bind(client),
    hGet: promisify(client.hget).bind(client),
    hSet: promisify(client.hset).bind(client),
    expire: promisify(client.expire).bind(client),
};
