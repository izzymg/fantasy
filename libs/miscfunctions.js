const fs = require("fs");
const sharp = require("sharp");

exports.createThumbnail = async function (inFilename, outFilename, width) {
    try {
        const image = sharp(inFilename);
        const metadata = await image.metadata();
        // Don't resize if image is smaller than a thumbnail
        if (metadata.width > width) {
            return await image.resize(150).toFormat("jpeg").toFile(outFilename);
        } else {
            return await image.toFormat("jpeg").toFile(outFilename);
        }
    } catch (e) {
        throw new Error(e);
    }
};

exports.unlink = function (path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, error => {
            if (error) {
                reject(new Error(error));
            }
            resolve();
        });
    });
};

exports.rename = function (path, newPath) {
    return new Promise((resolve, reject) => {
        fs.rename(path, newPath, error => {
            if (error) {
                reject(new Error(error));
            }
            resolve();
        });
    });
};

exports.standardText = function (str) {
    if (!str) { return null; }
    str = str.trim();
    if (!str) { return null; }
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
};