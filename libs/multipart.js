// Promise based multipart request parsing
const Busboy = require("busboy");
const uuid = require("uuid/v4");
const path = require("path");
const fs = require("fs");
const { getAcceptedMimetype } = require("./fileFunctions");
const { trimEscapeHtml } = require("./textFunctions");

module.exports = function(ctx, maxFiles, maxFileSize = 4096 * 1000, tmp) {
  return new Promise((resolve, reject) => {

    let files = [];
    let fields = {};

    // New busboy instance
    const busboy = new Busboy({
      headers: ctx.req.headers,
      limits: {
        files: maxFiles,
        fileSize: maxFileSize,
        fields: 10,
      }
    });

    busboy.on("file", async(fieldname, incoming, filename) => {

      // Hack for file fields without a file attached
      if(!filename) return incoming.resume();

      let type;

      incoming.on("data", (data) => {
        if(!type) {
          type = getAcceptedMimetype(data);
          if(!type) reject({
            status: 400, message: "Unnaccepted filetype"
          });
        }
      });

      incoming.on("limit", () => reject({
        status: 400,
        message: `File too large, max ${maxFileSize}`})
      );

      files.push(new Promise((res, rej) => {
        let fileId = uuid();
        let tempPath = path.join(tmp, fileId);
        let tempWriteStream = fs.createWriteStream(tempPath);
        incoming.pipe(tempWriteStream);
        tempWriteStream.on("error", rej);
        tempWriteStream.on("finish", () => {
          if(!type) return resolve();
          res({
            tempPath,
            fileId,
            extension: type.extension,
            mimetype: type.mimetype,
            size: tempWriteStream.bytesWritten,
            originalName: trimEscapeHtml(filename)
          });
        });
      }));
      
    });

    // Form fields
    busboy.on("field", async(name, value) => fields[name] = trimEscapeHtml(value));

    busboy.on("fieldsLimit", () => reject({
      status: 400, message: "Too many fields" 
    }));

    busboy.on("filesLimit", () => reject({
      status: 400,
      message: `Too many files, max ${maxFiles}`
    }));

    busboy.on("error", (error) => reject({
      status: 500,
      message: error
    }));

    busboy.on("finish", () => {
      Promise.all(files)
        .then((files) => resolve({ files: files.length > 0 ? files : null, fields }))
        .catch(reject);
    });

    // Pipe request into busboy after events established
    ctx.req.pipe(busboy);
  });
};