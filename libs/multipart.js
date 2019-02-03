// Async wrapper for writing busboy temp files

const libMime = require("../libs/mime");
const Busboy = require("busboy");
const fs = require("fs");
const uuid = require("uuid/v4");
const path = require("path");
const miscfunctions = require("./miscfunctions");
const crypto = require("crypto");

module.exports = function (ctx, maxFileSize, maxFiles, tmpDir, createHash) {
    return new Promise((resolve, reject) => {

        // New busboy instance with request headers
        const busboy = new Busboy({
            headers: ctx.headers, limits: {
                fileSize: maxFileSize,
                fields: 3,
                files: maxFiles
            }
        });

        let files = [];
        let fields = {};
        let temps = [];

        // Unlink all written temp files
        async function cleanup() {
            for (const t of temps) {
                await miscfunctions.unlink(t);
            }
        }

        // Read incoming files
        busboy.on("file", function (fieldname, file, originalName) {
            // Create unique file ID and write stream to temp path
            const fileId = uuid();
            const tempPath = path.join(tmpDir, fileId);
            temps.push(tempPath);
            const ws = fs.createWriteStream(tempPath);

            let mimetype;
            let extension;
            let firstBytes;
            let md5 = createHash ? crypto.createHash("md5") : null;

            // Each incoming data
            file.on("data", data => {
                // Check mimetype from first 12 bytes
                if (!firstBytes) {
                    firstBytes = data.slice(0, 12);
                    mimetype = libMime.getAcceptedMimetype(firstBytes);
                    if (!mimetype) {
                        return cleanup().then(() => reject("UNACCEPTED_MIMETYPE")).catch(e => reject(e));
                    }
                    extension = libMime.extensions[mimetype];
                }
                // Update hash with each data
                if (createHash) {
                    try {
                        md5.update(data);
                    } catch (error) {
                        return cleanup().then(() => reject(error)).catch(e => reject(e));
                    }
                }
            });

            ws.on("error", (error) => reject(error));

            file.on("limit", () => cleanup().then(() => reject("FILE_SIZE_LIMIT")).catch(e => reject(e)));

            file.on("end", () => {
                const fileObj = {
                    fileId,
                    tempPath,
                    originalName,
                    mimetype,
                    extension
                };
                if (createHash) {
                    fileObj.hash = md5.digest().toString("hex");
                }
                return files.push(fileObj);
            });

            // Write to temp
            file.pipe(ws);
        });

        // Read incoming text fields
        busboy.on("field", (name, value) => {
            fields[name] = value;
        });

        // Resolve busboy
        busboy.on("finish", function () {
            ctx.req.unpipe(busboy);
            resolve({ files, fields });
        });

        busboy.on("error", error => cleanup().then(() => reject(error)).catch(e => reject(e)));
        busboy.on("filesLimit", () => cleanup().then(() => reject("FILES_LIMIT")).catch(e => reject(e)));
        busboy.on("fieldsLimit", () => cleanup().then(() => reject("FIELDS_LIMIT")).catch(e => reject(e)));
        busboy.on("partsLimit", () => cleanup().then(() => reject("PARTS_LIMIT")).catch(e => reject(e)));

        // Pipe request object
        ctx.req.pipe(busboy);
    });
};
