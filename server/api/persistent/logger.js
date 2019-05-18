const config = require("../../config/config");
const pino = require("pino");

function createLogger() {
  return pino({ level: config.logLevel, }, config.logFile);
}

let log = createLogger();

/**
 * Reinitializes logger 
*/
function restart() {
  log = createLogger();
}

/**
 * Ends logger. Stub, does nothing for now.
*/

function end() {}

module.exports = {
  log,
  restart,
  end,
};