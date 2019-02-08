const redis = require("../database/redis");

exports.getSession = function (sessionId) {
    return new Promise((resolve, reject) => {
        redis.hgetall(sessionId, (error, reply) => {
            if (error) {
                return reject(error);
            }
            return resolve(reply);
        });
    });
};

exports.setSession = function (sessionId, { username, role }, expiry) {
    return new Promise((resolve, reject) => {
        redis.hmset(sessionId, { username, role }, (error) => {
            redis.expire(sessionId, expiry, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            });
            if (error) {
                return reject(error);
            }
        });
    });
};

