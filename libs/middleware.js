const fs = require("./fs");

exports.logRequestTime = function(logFile) {
  return async function(ctx, next) {
    const before = Date.now();
    await next();
    const after = Date.now() - before;
    fs.writeAppend(logFile, `Time ${ctx.method.toUpperCase()} "${ctx.url}": ${after} ms\n`);
  };
};

exports.handleErrors = function(logFile = null, logToConsole = false) {
  return async function(ctx, next) {
    try {
      await next();
    } catch(error) {
      const status = error.status || 500;
      if(status !== 500) {
        ctx.status = error.status;
        ctx.body = error.message || `Status ${error.status}`;
        return;
      }
      if(logFile) {
        fs.writeAppend(logFile, `${new Date(Date.now()).toLocaleString()} ${error}\n`);
      }
      if(logToConsole) {
        console.trace(error);
        console.error(error);
      }
      ctx.body = "Internal server error, status 500";
      ctx.status = 500;
      return;
    }
  };
};