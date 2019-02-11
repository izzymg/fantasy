/* 
Connection pooling is used to handle database connections via mysqljs
https://en.wikipedia.org/wiki/Connection_pool: read more
It's important to adjust these based on traffic and metrics
Increasing maximum connections will help bandwidth and latency issues, but affect server performance
The acquire time is how long a request can sit waiting for a database connection
    from the pool before being disconnected.
Enable metrics to get a report after server shutdown of how many connections were acquired
    and how long they had to wait.
*/ 

module.exports = {
    maxConnections: 5,
    maxAcquireTime: 6000,
    // Spams stdout with SQL query info
    debug: false,
    metrics: true,
    // Swaps all Redis operations to an in-memory store
    // For development *only*, never use in production
    memStore: true
};
