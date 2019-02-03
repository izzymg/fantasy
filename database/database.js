const mysql = require("mysql");
const secretsConfig = require("../config/secrets");
const databaseConfig = require("../config/database");
var db;

var settings = {
    database: "zthree",
    host: secretsConfig.host,
    port: secretsConfig.port,
    user: secretsConfig.username,
    password: secretsConfig.password,
    acquireTimeout: databaseConfig.maxAcquireTime,
    connectionLimit: databaseConfig.maxConnections
};

if (databaseConfig.debugMetrics) {
    console.warn("Enabling db debugging/metrics.");
    settings.debug = ["ComQueryPacket"];
}

const query = function (sql, values = []) {
    if (!db) throw "No database connection, did you call open()?";
    return new Promise((resolve, reject) => {
        db.query({ sql }, values, (error, results) => {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
};
module.exports = {
    open: async function () {
        db = mysql.createPool(settings);
        return { host: settings.host, port: settings.port };
    },
    close: function () {
        if (!db) throw "No db connection but called close()";
        return new Promise((resolve, reject) => {
            console.log("Closing database connection");
            db.end((error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
    },
    fetch: async function (sql, values) {
        const res = await query(sql, values);
        if (res.length < 1) { return null; }
        return { ...res[0] };
    },
    fetchAll: async function (sql, values) {
        const res = await query(sql, values);
        return [...res];
    },
    query: async function (sql, values) {
        const res = await query(sql, values);
        return { affected: res.affectedRows || 0, inserted: res.insertId || null, changed: res.changedRows || 0 };
    }
};