// Misc string validation functions
exports.lengthCheck = function(str, max, name) {
  if (!str) {
    return null;
  }
  if (typeof str !== "string") {
    return `${name}: expected string.`;
  }

  str = str.trim();
  if (str.length > max) {
    return `${name} must be under ${max} characters.`;
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
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`/g, "&#96;")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/\n/g, "<br>")
    .replace(/(<br>){2,}/g, "<br><br>");
};

exports.formatPostContent = function(str) {
  if (!str || typeof str !== "string") {
    return null;
  }
  str = str.replace(/&gt;&gt;([0-9]*)\/([0-9]*)/gm, 
    "<a class='quotelink' data-id='$2' href='../threads/$2#$3'>>>$2/$3</a>"
  );
  str = str.replace(/&gt;&gt;([0-9]*)/gm, 
    "<a class='quotelink' data-id='$1' href='#$1'>>>$1</a>"
  );
  str = str.replace(/&gt;([A-Za-z0-9'";:\s)(*&^%$#@!`~\\|]+)/gm, "<span class='quote'>>$1</span>");
  return str;
};