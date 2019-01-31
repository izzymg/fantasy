const Sequelize = require("sequelize");
const secrets = require("../config/secrets");
const databaseConfig = require("../config/database");

var settings = {
    dialect: databaseConfig.dialect,
    database: "zthree",
    host: secrets.host,
    port: secrets.port,
    username: secrets.username,
    password: secrets.password,
    pool: {
        idle: databaseConfig.maxIdleTime,
        evict: databaseConfig.maxIdleTime,
        max: databaseConfig.maxConnections,
        acquire: databaseConfig.maxAcquireTime
    }
};

console.log(`Starting SQL connection on ${settings.host}:${settings.port}`);

if(databaseConfig.debugMetrics) {
    console.log("Enabling db debugging/metrics.");
    settings.logging = function(log, ...rest) {
        console.log(log, {...rest}, "\ntodo");
    };
}

const db = new Sequelize(settings);
db.authenticate().then(() => {
    console.log("ZThree: Successfully connected to SQL database");
}).catch(error => {
    console.error("ZThree ERROR: Failed to connect to database", error);
});

module.exports = db;