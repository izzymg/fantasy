const mysql = require("mysql");
const { promisify } = require("util");

function queryFactory(connection) {
    const query = promisify(connection.query).bind(connection);
    return {
        query: async ({ sql, values = [], nestTables = false }) => {
            const res = await query({ sql, values, nestTables });
            return res;
        },
        getOne: async ({ sql, values = [], nestTables = false }) => {
            const res = await query({ sql, values, nestTables });
            if(!res || res.length < 1) return null;
            return res[0];
        },
        getAll: async ({ sql, values = [], nestTables = false }) => {
            const res = await query({ sql, values, nestTables });
            if(!res || res.length < 1) return null;
            return [ ...res ];
        }
    };
}

function connectionFactory(pool) {
    // Wrapped to promisify connection methods when obtained from pools
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => {
            if(error) reject(error);
            const queries = queryFactory(connection);
            resolve({
                ...queries,
                beginTransaction: promisify(connection.beginTransaction).bind(connection),
                commit: promisify(connection.commit).bind(connection),
                rollback: promisify(connection.rollback).bind(connection),
                release: promisify(connection.release).bind(connection)
            });
        });
    });
}

exports.createPool = (
    { user, password, host, port, database },
    { connectionLimit = 5, acquireTimeout = 30000, connectTimeout = 30000 }) => {
    const pool = mysql.createPool({
        user, password, host, port, database,
        connectTimeout, connectionLimit, acquireTimeout
    });
    const queries = queryFactory(pool);
    console.log("SQL connection pool started on ", host, port);
    return {
        // Return promisifed pool methods
        ...queries,
        getConnection: () => connectionFactory(pool),
        end: promisify(pool.end).bind(pool)
    };
};