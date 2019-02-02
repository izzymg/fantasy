const fs = require("fs");

exports.unlink = function (path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, (error) => {
            if (error) {
                reject(error)
            }
            resolve();
        });
    });
}

exports.rename = function (path, newPath) {
    return new Promise((resolve, reject) => {
        fs.rename(path, newPath, (error) => {
            if (error) {
                reject(error);
            }
            resolve();
        });
    });
}

exports.standardText = function (str) {
    if (!str) { return null; }
    str = str.trim();
    return str
        .replace(/\//g, "&#x2F;")
        .replace(/\\/g, "&#x5C;")
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
}