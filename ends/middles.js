// General middleware
const coBody = require("co-body");
const fileFunctions = require("../libs/fs");

exports.cors = function(allowed = "*") {
  return async(ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", allowed);
    return await next();
  };
};
exports.getFormData = async function(ctx, next) {
  if (!ctx.is("application/json") && !ctx.is("application/x-www-form-urlencoded")) {
    return ctx.throw(400, "Expected JSON or x-www-form-urlencoded data");
  }
  try {
    ctx.fields = await coBody(ctx, { limit: "12kb" });
  } catch (error) {
    if (error.status === 400) {
      return ctx.throw(400, error.message || "Bad request");
    }
    return ctx.throw(500, new Error(error));
  }
  return next();
};

exports.logRequest = function(logTime = true, logInfo = false, file) {
  return async(ctx, next) => {
    let writeOut = `${new Date(Date.now()).toLocaleString()}: `;
    if(logInfo) {
      writeOut += `IP: ${ctx.ip}, Method: ${ctx.method}, Url: ${ctx.url}, Protocol: ${ctx.protocol}, Secure: ${ctx.secure || false}`;
    }
    if(logTime) {
      const start = Date.now();
      await next();
      const timeTaken = Date.now() - start;
      writeOut += `\n\tResponse time: ${timeTaken}ms`;
    }
    fileFunctions.writeAppend(file, writeOut + "\n");
  };
};

exports.handleErrors = function(prefix, logfile = null, logconsole = false) {
  return async(ctx, next) => {
    try {
      await next();
    } catch(error) {
      const status = error.statusCode || error.status || 500;
      if(status === 500) {
        if(logconsole) {
          console.error(error);
          console.trace(error);
        }
        if(logfile) {
          await fileFunctions.writeAppend(logfile, `${prefix}${error}\n`);
        }
        ctx.status = 500;
        return ctx.body = "Internal server error";
      }
      // 400 bad requests take error.message
      ctx.status = status;
      return ctx.body = error.message || "Unknown error";
    }
  };
};