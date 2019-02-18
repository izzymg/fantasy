// Promise based multipart request parsing
const Busboy = require("busboy");

module.exports = function(ctx, maxFiles, maxFileSize = 4096 * 1000, onFile, onField) {
  return new Promise((resolve, reject) => {

    // New busboy instance
    const busboy = new Busboy({
      headers: ctx.headers,
      limits: {
        files: maxFiles,
        fileSize: maxFileSize,
        fields: 10,
      }
    });

    // "File" parameter is a readable stream
    busboy.on("file", async(fieldname, stream, filename, encoding, mimetype) => {
      // Hack for file fields without a file attached
      if(!filename) {
        stream.resume();
        return;
      }
      try {
        await onFile(stream, filename);
      } catch(error) {
        ctx.req.unpipe(busboy);
        return reject(error);
      }
    });

    // Form fields
    busboy.on("field", async(name, value) => {
      try {
        await onField(name, value);
      } catch(error) {
        ctx.req.unpipe(busboy);
        return reject(error);
      }
    });

    busboy.on("fieldsLimit", function() {
      ctx.req.unpipe(busboy);
      return reject({ status: 400, message: "Too many fields" });
    });

    busboy.on("filesLimit", function() {
      ctx.req.unpipe(busboy);
      return reject({
        status: 400,
        message: `Too many files, max ${maxFiles}`
      });
    });

    busboy.on("limit", () => {
      ctx.req.unpipe(busboy);
      return reject({
        status: 400,
        message: `File too large, max ${maxFileSize}`
      });
    });

    busboy.on("error", (error) => {
      ctx.req.unpipe(busboy);
      return reject({
        status: 500,
        message: error
      });
    });

    busboy.on("finish", () => {
      ctx.req.unpipe(busboy);
      return resolve();
    });

    // Pipe request into busboy after events established
    ctx.req.pipe(busboy);
  });
};