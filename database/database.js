const mysql = require("mysql");
const secretsConfig = require("../config/secrets");
const databaseConfig = require("../config/database");

var settings = {
    database: "zthree",
    host: secretsConfig.host,
    port: secretsConfig.port,
    user: secretsConfig.username,
    password: secretsConfig.password,
    acquireTimeout: databaseConfig.maxAcquireTime,
    connectionLimit: databaseConfig.maxConnections
};

console.log(`Starting SQL connection on ${settings.host}:${settings.port}`);

if(databaseConfig.debugMetrics) {
    console.warn("Enabling db debugging/metrics.");
    settings.debug = ["ComQueryPacket"];
}

try {
    const db = mysql.createPool(settings);
    const query = function(sql, values = []) {
        return new Promise((resolve, reject) => {
            db.query({ sql }, values, (error, results) => {
                if(error) {
                    reject(error);
                }
                resolve(results);
            });
        });
    };
    module.exports = {
        fetch: async function(sql, values) {
            const res = await query(sql, values);
            if(res.length < 1) { return null; }
            return {...res[0]};
        },
        fetchAll: async function(sql, values) {
            const res = await query(sql, values);
            return [...res];
        },
        query: async function(sql, values) {
            const res = await query(sql, values);
            return {affected: res.affectedRows || 0, inserted: res.insertId || null, changed: res.changedRows || 0};
        }
    };
    console.log("ZThree: Successfully connected to database");
} catch(e) {
    console.error("ZThree ERROR: Failed to connect to database ", e);
}