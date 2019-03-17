const jEncoding = require("encoding-japanese");
const crypto = require("crypto");
const validationError = (message) => ({ status: 400, message });

// Misc string validation functions
exports.lengthCheck = function(str, max, name) {
  if (!str) {
    return null;
  }
  if (typeof str !== "string") {
    throw validationError(`${name}: expected string.`);
  }

  str = str.trim();
  if (str.length > max) {
    
    throw validationError(`${name} must be under ${max} characters.`);
  }

  if (!str) {
    return null;
  }

  return null;
};

exports.sanitize = function(str) {
  if(!str) return null;
  str = str.trim();
  if (!str) {
    return null;
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n");
};

exports.formatNameContent = function(name, tripAlg, tripSalt) {
  const tripIndex = name.indexOf("#");
  if(tripIndex !== -1) {
    const trip = crypto.createHmac(tripAlg, tripSalt);
    const password = jEncoding.base64Encode(jEncoding
      .convert(Buffer.from(name.slice(tripIndex + 1), "utf8"), "SJIS", "utf8"));
    trip.update(password);
    name = name.slice(0, tripIndex) + "<span class='trip'>!#" + 
    exports.sanitize(trip.digest("base64")) + "</span>";
  }
  return name;
};

exports.formatPostContent = function(str) {
  if (!str || typeof str !== "string") {
    return null;
  }
  str = str
    .replace(/&gt;&gt;([0-9]*)\/([0-9]*)/gm, 
      "<a class='quotelink' data-id='$2' href='../threads/$2#$3'>>>$2/$3</a>"
    )
    .replace(/&gt;&gt;([0-9]*)/gm, 
      "<a class='quotelink' data-id='$1' href='#$1'>>>$1</a>"
    )
    .replace(/&gt;([A-Za-z0-9'";:\s)(*&^%$#@!`~\\|]+)/gm, "<span class='quote'>>$1</span>")
    .replace(/(<br>){2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");
  return str;
};