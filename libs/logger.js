const fs = require("fs");

exports.logOut = function(err, file) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(file, { flags: "a" }, "utf-8");
        ws.write(`\n${new Date(Date.now()).toLocaleString("en-US")} - Zaela: ${err}`, error => {
            if (error) {
                reject(`Error writing to log file:\n${error}`);
            }
            resolve();
        });
    });
};
