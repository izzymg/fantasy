const pino = require("pino");

let _logger;

exports.init = function(level, dest) {
  exports.log = _logger = pino({
    level,
  }, pino.destination(dest));
};