// Async wrapper for writing busboy temp files

const libMime = require("../libs/mime");
const Busboy = require("busboy");
const fs = require("fs");
const uuid = require("uuid/v4");
const path = require("path");
const miscfunctions = require("./miscfunctions");

module.exports = function (ctx, maxFileSize, maxFiles, tmpDir) {
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
                miscfunctions.unlink(t);
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
                reject(error);
            });

            let mimetype;
            let ext;
            let checked = false;

            file.on("data", data => {
                if (!checked) {
                    // Check mimetype from first 12 bytes
                    const byteRef = data.slice(0, 12);
                    mimetype = libMime.getAcceptedMimetype(byteRef);
                    if (!mimetype) {
                        cleanup().then(() => {
                            return reject("UNACCEPTED_MIMETYPE");
                        }).catch(error => {
                            return reject(error);
                        });
                    }
                    ext = libMime.extensions[mimetype];
                    checked = true;
                }
            });

            file.on("limit", () => {
                cleanup().then(() => {
                    return reject("FILE_SIZE_LIMIT");
                }).catch(error => {
                    return reject(error);
                });
            });

            file.on("end", () => {
                files.push({ id: fileId, tempPath, originalName, mimetype, extension: ext });
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
            cleanup().then(() => reject(error)).catch(e => reject(e));
        });
        busboy.on("filesLimit", () => {
            cleanup().then(() => reject("FILES_LIMIT")).catch(e => reject(e));
        });
        busboy.on("fieldsLimit", () => {
            cleanup().then(() => reject("FIELDS_LIMIT")).catch(e => reject(e));
        });
        busboy.on("partsLimit", () => {
            cleanup().then(() => reject("PARTS_LIMIT")).catch(e => reject(e));
        });

        // Pipe request object
        ctx.req.pipe(busboy);
    });
};
