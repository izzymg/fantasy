
// Promise based multipart request parsing
const Busboy = require("busboy");
const uuid = require("uuid/v4");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const MAGICS_MIMES = {
  "89504E470D0A1A0A": "image/png",
  // There are two potential accepted gif types
  "474946383761": "image/gif",
  "474946383961": "image/gif",
  "FFD8": "image/jpeg",
};

const MIME_EXTENSIONS = {
  "image/png": "png",
  "image/gif": "gif",
  "image/jpeg": "jpg",
};

let _opts = {
  maxFiles: 3,
  maxFileSize: 4096 * 1000,
  tempDirectory: require("os").tmpdir(),
  checkMimetype: true,
  md5: true,
};

function getAcceptedMimetype(buffer) {
  const chunkString = buffer.toString("hex");
  for (const sig in MAGICS_MIMES) {
    if(sig === chunkString.slice(0, sig.length).toUpperCase()) {
      // Signature found in data chunk
      let mimetype = MAGICS_MIMES[sig];
      return { mimetype, extension: MIME_EXTENSIONS[mimetype], };
    }
  }
  return null;
}


function multipartRequest(req) {
  return new Promise((resolve, reject) => {

    let files = [];
    let fields = {};

    // New busboy instance
    const busboy = new Busboy({
      headers: req.headers,
      limits: {
        files: _opts.maxFiles,
        fileSize: _opts.maxFileSize,
        fields: 10,
      },
    });

    busboy.on("file", async(fieldname, incoming, filename) => {

      // Hack for file fields without a file attached
      if(!filename) return incoming.resume();

      let type;
      let hash = crypto.createHash("md5");

      incoming.on("data", (data) => {
        if(_opts.md5) {
          hash.update(data);
        }
        if(_opts.checkMimetype && !type) {
          type = getAcceptedMimetype(data);
          if(!type) reject({
            status: 400, message: "Unnaccepted filetype",
          });
        }
      });

      incoming.on("limit", () => reject({
        status: 400,
        message: `File too large, max ${_opts.maxFileSize}`,
      }));

      files.push(new Promise((res, rej) => {
        let id = uuid();
        let tempPath = path.join(_opts.tempDirectory, id);
        let tempWriteStream = fs.createWriteStream(tempPath);
        incoming.pipe(tempWriteStream);
        tempWriteStream.on("error", rej);
        tempWriteStream.on("finish", () => {
          if(!type) return resolve();
          res({
            tempPath: tempPath,
            info: {
              filename: id + "." + type.extension,
              mimetype: type.mimetype,
              size: tempWriteStream.bytesWritten,
              originalName: filename,
              hash: _opts.md5 ? hash.digest("hex") : null,
            },
          });
        });
      }));
      
    });

    // Form fields
    busboy.on("field", async(name, value) => fields[name] = value);

    busboy.on("fieldsLimit", () => reject({
      status: 400, message: "Too many fields", 
    }));

    busboy.on("filesLimit", () => reject({
      status: 400,
      message: `Too many files, max ${_opts.maxFiles}`,
    }));

    busboy.on("error", (error) => reject({
      status: 500,
      message: error,
    }));

    busboy.on("finish", () => {
      Promise.all(files)
        .then((files) => resolve({ files: files.length > 0 ? files : null, fields, }))
        .catch(reject);
    });

    // Pipe request into busboy after events established
    req.pipe(busboy);
  });
}

module.exports = function({
  maxFiles, maxFileSize, tempDirectory, md5, checkMimetype,
} = { md5: true, checkMimetype: true, }) {
  _opts = {
    ..._opts,
    maxFiles,
    maxFileSize,
    tempDirectory,
    md5,
    checkMimetype,
  };
  return multipartRequest;
};