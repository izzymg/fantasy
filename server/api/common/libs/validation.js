const jEncoding = require("encoding-japanese");
const crypto = require("crypto");
const validationError = (message) => ({ status: 400, message, });

// Misc string validation functions

/**
 * Checks str is <= max, error formatted by 'name'
 * @returns { string } Error message if too long
 * @returns { null } If okay
 * 
*/
function lengthCheck(str, max, name) {
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
}

/**
 * Sanitizes dangerous HTML elements out of str
 * @param { string } str String to be processed
 * @returns { string } Sanitized string
 * @returns { null } Null if str was invalid
*/
function sanitize(str) {
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
}

/**
 * Formats a post name, processing tripcode text
 * @param { string } name
 * @param { string } tripAlg Supported crypto hmac algorithm for tripcodes 
 * @param { string } tripSalt Salt used for algorithm 
 * @returns { string } Formatted name
*/
function formatNameContent(name, tripAlg, tripSalt) {
  if(!name || typeof name !== "string") {
    return null;
  }
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
}

/**
 * Formats a post content, processing quotes, newlines, etc
 * @param { string } content Post content
 * @returns { string } content Formatted post content 
*/
function formatPostContent(content) {
  if (!content || typeof content !== "string") {
    return null;
  }
  content = content
    .replace(/&gt;&gt;([0-9]*)\/([0-9]*)/gm, 
      "<a class='quotelink' data-number='$2' href='../threads/$2#$3'>>>$2/$3</a>"
    )
    .replace(/&gt;&gt;([0-9]*)/gm, 
      "<a class='quotelink' data-number='$1' href='#$1'>>>$1</a>"
    )
    .replace(/(<br>){2,}/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/&gt;([^<]+)/gm, "<span class='quote'>>$1</span>");
  return content;
}

module.exports = {
  lengthCheck,
  sanitize,
  formatNameContent,
  formatPostContent,
};