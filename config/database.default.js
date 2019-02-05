// Sequelize is used for the SQL connection
// It pools connections using node-pool, read on connection pooling here 
// https://en.wikipedia.org/wiki/Connection_pool
// It's important to adjust these based on traffic and metrics

module.exports = {
    // Maximum connections stored in the SQL connection pool
    // Can have major consequences on speed, generally go higher if more threads/more traffic
    maxConnections: 5,
    // Maximum time the database should try to get a connection in MS
    maxAcquireTime: 6000,
    // Enable to stam stdout with every SQL query
    debug: false,
    // Enable to get details on connection pooling
    metrics: true
};