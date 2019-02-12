const mysql = require("mysql");
const secretsConfig = require("../config/private").database;
const databaseConfig = require("../config/config").database;
var db;

var settings = {
    database: "zthree",
    host: secretsConfig.host,
    port: secretsConfig.port,
    user: secretsConfig.username,
    password: secretsConfig.password,
    acquireTimeout: databaseConfig.maxAcquireTime,
    connectionLimit: databaseConfig.maxConnections,
};

var metrics;

if (databaseConfig.debug) {
    console.warn("Enabling db debugging.");
    settings.debug = ["ComQueryPacket"];
}

const query = function(sql, values = [], nestTables = false) {
    if (!db) throw "No database connection, did you call open()?";
    return new Promise((resolve, reject) => {
        db.query({ sql, nestTables }, values, (error, results) => {
            if (error) {
                if (error.code === "ER_NO_SUCH_TABLE") {
                    console.error("Noticed no-such-table - ensure you ran the setup.js file");
                }
                return reject(error);
            }
            resolve(results);
        });
    });
};

const getConnection = function() {
    if (!db) throw "No database connection, did you call open()?";
    return new Promise((resolve, reject) => {
        db.getConnection((error, connection) => {
            if (error) {
                return reject(error);
            }
            return resolve({
                query: function(sql, values, nestTables = false) {
                    return new Promise((resolve, reject) => {
                        connection.query({ sql: sql, nestTables }, values, (err, results) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(results);
                        });
                    });
                },
                rollback: function() {
                    return new Promise(resolve => {
                        connection.rollback(() => {
                            resolve();
                        });
                    });
                },
                release: function() {
                    return connection.release();
                },
                beginTransaction: function() {
                    return new Promise((resolve, reject) => {
                        connection.beginTransaction(error => {
                            if (error) {
                                return reject(error);
                            }
                            return resolve();
                        });
                    });
                },
                commit: function() {
                    return new Promise((resolve, reject) => {
                        connection.commit(error => {
                            if (error) {
                                return reject(error);
                            }
                            return resolve();
                        });
                    });
                },
            });
        });
    });
};

const transaction = async function(queries) {
    if (!db) throw "No database connection, did you call open()?";
    let connection;
    let aggregate = [];
    try {
        connection = await getConnection();
        for (const query of queries) {
            const values = await connection.query(
                query.sql,
                query.values || [],
                query.nestTables || false
            );
            aggregate.push(values);
        }
        await connection.commit();
    } catch (e) {
        await connection.rollback();
        await connection.release();
        throw e;
    }
    await connection.release();
    return aggregate;
};

module.exports = {
    open: async function() {
        db = mysql.createPool(settings);
        if (databaseConfig.metrics) {
            console.log("Enabling metrics");
            metrics = {
                timesAcquired: 0,
                timesEnqueued: 0,
            };
            db.on("acquire", () => {
                metrics.timesAcquired++;
            });
            db.on("enqueue", () => {
                metrics.timesEnqueued++;
            });
        }
        return { host: settings.host, port: settings.port };
    },
    close: function() {
        if (!db) throw "No db connection but called close()";
        if (databaseConfig.metrics) {
            console.log(
                `Connections acquired from pool: ${
                    metrics.timesAcquired
                }\nTimes queries had to wait for a connection: ${metrics.timesEnqueued}`
            );
        }
        return new Promise((resolve, reject) => {
            db.end(error => {
                if (error) {
                    return reject(error);
                }
                db = null;
                resolve();
            });
        });
    },
    fetch: async function(sql, values, nestTables) {
        const res = await query(sql, values, nestTables);
        if (res.length < 1) {
            return null;
        }
        return { ...res[0] };
    },
    fetchAll: async function(sql, values, nestTables) {
        const res = await query(sql, values, nestTables);
        if (res.length < 1) {
            return null;
        }
        return [...res];
    },
    query: async function(sql, values, nestTables) {
        const res = await query(sql, values, nestTables);
        return {
            affected: res.affectedRows || 0,
            inserted: res.insertId || null,
            changed: res.changedRows || 0,
        };
    },
    transaction: transaction,
};
