const dbConnection = require("../db/connection");
const config = require("../../config/config");
const fs = require("fs");
const util = require("util");
const fsAccess = util.promisify(fs.access);

module.exports = async function(onEvent, onWarning, onError) {
  function ev(e) {
    onEvent(`Health check: ${e}`);
  }
  function warn(w) {
    onWarning(`Health check warning: ${w}`);
  }
  function err(e) {
    onError(`Health check error: ${e}`);
  }

  if(
    config.logLevel !== "info" &&
    config.logLevel !== "error" &&
    config.logLevel !== "fatal"
  ) {
    warn(`Invalid config.logLevel: ${config.logLevel}`);
  }

  if(config.noRedis) {
    warn("Config.noRedis is set. Never use this in production");
  }

  if(config.consoleLogErrors) {
    warn("Console log errors is set. This will log any 500 error messages to stdout");
  }

  try {
    const conn = await dbConnection.db.getConnection();
    await conn.ping();
    ev("DB connection pinged successfully");
  } catch(error) {
    err(`Failed to connect to SQL database: ${error}`);
  }
  try {
    await dbConnection.mem.ping();
    ev("Redis pinged successfully");
  } catch(error) {
    err(`Failed to ping redis: ${error}`);
  }

  try {
    await fsAccess(config.logFile, fs.constants.W_OK);
    ev("Log file opened successfully");
  } catch(error) {
    err(`Failed to open log file ${error}`);
  }

  try {
    await fsAccess(config.posts.filesDir, fs.constants.W_OK);
    ev("Files directory opened successfully");
  } catch(error) {
    err(`Failed to open log file ${error}`);
  }

  try {
    await fsAccess(config.posts.tmpDir, fs.constants.W_OK);
    ev("Temp directory opened successfully");
  } catch(error) {
    err(`Failed to open log file ${error}`);
  }
  return;
};