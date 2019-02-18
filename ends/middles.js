// General middleware
const coBody = require("co-body");
const fileFunctions = require("../libs/fileFunctions");

exports.requirePrivate = function(key) {
  return async(ctx, next) => {
    const pk = ctx.cookies.get("pk");
    if(pk === key) {
      return await next();
    }
    return ctx.throw(403);
  };
};

exports.getFormData = async(ctx, next) =>  {
  if(!ctx.method === "POST") {
    return await next();
  }
  if (!ctx.is("application/json") && !ctx.is("application/x-www-form-urlencoded")) {
    return ctx.throw(400, "NOT_JSON_OR_URLENCODED");
  }
  try {
    ctx.fields = await coBody(ctx, { limit: "12kb" });
  } catch (error) {
    if (error.status === 400) {
      return ctx.throw(400, "INVALID_DATA");
    }
    return ctx.throw(500, new Error(error));
  }
  return next();
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
      return ctx.body = error.message || "Unknown error";
    }
  };
};