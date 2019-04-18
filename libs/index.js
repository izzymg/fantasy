const filer = require("./filer");
const multipart = require("./multipart");
const redis = require("./redis");
const memstore = require("./memstore");
const validation = require("./validation");

module.exports = {
  files: filer,
  multipart,
  redis,
  memstore,
  validation
};