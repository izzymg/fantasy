// Async wrapper for writing busboy temp files

const libMime = require("../libs/mime");
const Busboy = require("busboy");
const fs = require("fs");
const uuid = require("uuid/v4");
const path = require("path");
const miscfunctions = require("./miscfunctions");
const crypto = require("crypto");

module.exports = function (ctx, maxFileSize, maxFiles, tmpDir, hash) {
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

        // Unwrite all written temp files
        async function cleanup() {
            for (const t of temps) {
                try {
                    await miscfunctions.unlink(t);
                } catch (e) {
                    return reject(e);
                }
            }
        }

        // Read incoming files
        busboy.on("file", function (fieldname, file, originalName) {

            // Establish ID and write stream to temporary directory
            const fileId = uuid();
            const tempPath = path.join(tmpDir, fileId);
            temps.push(tempPath);
            const ws = fs.createWriteStream(tempPath);

            ws.on("error", (error) => {
                return reject(error);
            });

            let mimetype;
            let ext;
            let checked = false;
            let md5 = hash ? crypto.createHash("md5") : null;

            file.on("data", data => {
                // Check mimetype from first 12 bytes
                if (!checked) {
                    const byteRef = data.slice(0, 12);
                    mimetype = libMime.getAcceptedMimetype(byteRef);
                    if (!mimetype) {
                        return cleanup().then(() => reject("UNACCEPTED_MIMETYPE")).catch(e => reject(e));
                    }
                    ext = libMime.extensions[mimetype];
                    checked = true;
                }
                // Update hash with buffer data
                if (hash) {
                    try {
                        md5.update(data);
                    } catch (error) {
                        return cleanup().then(() => reject(error)).catch(e => reject(e));
                    }
                }
            });

            file.on("limit", () => {
                cleanup().then(() => reject("FILE_SIZE_LIMIT")).catch(e => reject(e));
            });

            file.on("end", () => {
                files.push({ id: fileId, tempPath, originalName, mimetype, extension: ext, hash: md5.digest().toString("hex") });
            });

            // Pipe file into temp dir stream
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

        busboy.on("error", error => {
            return cleanup().then(() => reject(error)).catch(e => reject(e));
        });
        busboy.on("filesLimit", () => {
            return cleanup().then(() => reject("FILES_LIMIT")).catch(e => reject(e));
        });
        busboy.on("fieldsLimit", () => {
            return cleanup().then(() => reject("FIELDS_LIMIT")).catch(e => reject(e));
        });
        busboy.on("partsLimit", () => {
            return cleanup().then(() => reject("PARTS_LIMIT")).catch(e => reject(e));
        });

        // Pipe request object
        ctx.req.pipe(busboy);
    });
};
