// Middleware used by routes to establish data on the request body
const textFunctions = require("../../libs/textFunctions");
const mltp = require("../../libs/multipart");
const fileFunctions = require("../../libs/fileFunctions");

// Collects and handles files and fields from multipart requests
exports.getMultipart = function(maxFileSize, maxFiles, tmpDir) {
  return async function(ctx, next) {

    if(!ctx.is("multipart/form-data")) {
      return ctx.throw(400, "Expected multipart/form-data");
    }

    // Handle temp file, mimetype, extension
    async function fileHandler(stream, originalName) {
      if(!ctx.files) ctx.files = [];
      const file = await fileFunctions.processFile(stream, tmpDir);
      // Escape file's original name and push data
      file.originalName = textFunctions.trimEscapeHtml(originalName);
      ctx.files.push(file);
  
    }

    try {
      // Get get and escape fields
      const fields = await mltp(ctx, maxFiles, maxFileSize, fileHandler);
      if(fields) {
        ctx.fields = {};
        for(const field in fields) {
          ctx.fields[field] = textFunctions.trimEscapeHtml(fields[field]);
        }
      }
      if(!ctx.fields && !ctx.files) {
        return ctx.throw(400, "Expected multipart/form-data");
      }
    } catch(error) {
      if(error.status === 400) {
        return ctx.throw(400, error.message);
      }
      return ctx.throw(500, error);
    }
    return await next();
  };
};