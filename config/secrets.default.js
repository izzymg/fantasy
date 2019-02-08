const secretsFile = null;
if (secretsFile) {
    module.exports = require(secretsFile);
} else {
    // IMPORTANT: if you don't want to store your secrets here,
    // copy the below module.exports = {...} section into any file    
    module.exports = {
        database: {
            username: "root",
            password: "rootpassword",
            port: 3306,
            host: "localhost"
        },
        redis: {
            port: 6379,
            password: "redispassword",
            host: "localhost"
        }
    };
    // then replace "null" at the top of this file with a string location of that file
    // e.g. const secretsFile = "/var/www/secrets.js";
    // However it is generally safe to write them here, as it is not tracked by git nor exposed in anyway
}