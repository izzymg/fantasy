const formidable = require("formidable");
let _opts = {
  tempDirectory: require("os").tmpdir,
  maxFileSize: 4096 * 1000,
  maxFiles: 2,
  hash: "md5",
};

function parseForm(request) {
  return new Promise((resolve, reject) => {
    const parser = new formidable.IncomingForm();
    let fileCount = 0;

    parser.multiples = true;
    parser.uploadDir = _opts.tempDirectory;
    parser.maxFileSize = _opts.maxFileSize;
    parser.hash = _opts.hash;

    parser.on("file", function() {
      fileCount++;
      if(fileCount > _opts.maxFiles) {
        reject({ status: 400, message: "TOO_MANY_FILES" });
      }
    });

    parser.parse(request, (error, fields, files) => {
      if(error) {
        return reject(error);
      }
      return resolve({ fields, files });
    });
  });
}

module.exports = function({ tempDirectory, maxFileSize, maxFiles, hash, }) {
  // Set internal options
  _opts.hash = hash;
  _opts.tempDirectory = tempDirectory || null;
  // Undefined checking for allowing zero max files
  if(maxFileSize !== undefined) {
    _opts.maxFileSize = maxFileSize;
  }
  if(maxFiles !== undefined) {
    _opts.maxFiles = maxFiles;
  }
  return parseForm;
};