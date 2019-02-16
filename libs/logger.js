const fs = require("fs");

exports.logOut = function(err, file) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(file, { flags: "a" }, "utf-8");
        ws.write(`\n${new Date(Date.now()).toLocaleString()} - ZThree: ${err}`, error => {
            if (error) {
                ws.close();
                return reject(`Error writing to log file:\n${error}`);
            }
            ws.close();
            return resolve();
        });
    });
};
