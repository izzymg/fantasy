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
