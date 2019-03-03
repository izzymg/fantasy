
// Promise based multipart request parsing
const Busboy = require("busboy");
const uuid = require("uuid/v4");
const path = require("path");
const fs = require("fs");

const trimEscapeHtml = function(str) {
  if (!str) {
    return null;
  }
  str = str.trim();
  if (!str) {
    return null;
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "&#96;")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/\n/g, "<br>")
    .replace(/(<br>){2,}/g, "<br><br>");
};

const fileSignatures = {
  "89504E470D0A1A0A": "image/png",
  // There are two potential accepted gif types
  "474946383761": "image/gif",
  "474946383961": "image/gif",
  "FFD8": "image/jpeg",
};

const extensions = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
};

const getAcceptedMimetype = function(buffer) {
  // Remove listener once called once
  const chunkString = buffer.toString("hex");
  for (const sig in fileSignatures) {
    if(sig === chunkString.slice(0, sig.length).toUpperCase()) {
      // Signature found in data chunk
      let mimetype = fileSignatures[sig];
      return { mimetype, extension: extensions[mimetype] };
    }
  }
  return null;
};


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
        let id = uuid();
        let tempPath = path.join(tmp, id);
        let tempWriteStream = fs.createWriteStream(tempPath);
        incoming.pipe(tempWriteStream);
        tempWriteStream.on("error", rej);
        tempWriteStream.on("finish", () => {
          if(!type) return resolve();
          res({
            filename: id + "." + type.extension,
            thumbFilename: type.mimetype.indexOf("image") !== -1 ? id + "_thumb.jpg" : null,
            tempPath,
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