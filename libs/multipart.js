// Promise based multipart request parsing
const Busboy = require("busboy");

module.exports = function(ctx, maxFiles, maxFileSize = 4096 * 1000, fileHandler) {
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

    let fields = {};

    // "File" parameter is a readable stream
    busboy.on("file", async function(field, file, originalName) {
      try {
        await fileHandler(file, originalName);
      } catch(error) {
        return reject(error);
      }
    });

    // Form fields
    busboy.on("field", (name, value) => {
      fields[name] = value;
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
      return resolve(fields);
    });

    // Pipe request into busboy after events established
    ctx.req.pipe(busboy);
  });
};