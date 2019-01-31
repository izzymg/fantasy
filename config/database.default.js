// Sequelize is used for the SQL connection
// It pools connections using node-pool, read on connection pooling here 
// https://en.wikipedia.org/wiki/Connection_pool
// It's important to adjust these based on traffic and metrics

module.exports = {
    // Dialect of SQL (note - no SQLite support currently)
    // 'mysql'|'postgres'
    dialect: "mysql",
    // Maximum connections stored in the SQL connection pool
    // Can have major consequences on speed, generally go higher if more threads/more traffic
    maxConnections: 5,
    // Maximum time an idle connection can sit in MS
    maxIdleTime: 10000,
    // Maximum time the database should try to get a connection in MS
    maxAcquireTime: 6000,
    // Enable this to get metrics logs. Large performance impact.
    debugMetrics: false
};