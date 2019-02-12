module.exports = {
    database: {
        maxConnections: 1,
        maxAcquireTime: 6000,
        debug: false,
        metrics: true,
        memStore: true,
    },

    server: {
        port: 3000,
        host: "localhost",
        https: true,
        httpsPort: 3001,
        log: "C:/db/z.log",
        consoleErrors: true,
        webname: "ZChan",
    },

    posts: {
        maxNameLength: 16,
        maxSubjectLength: 60,
        maxContentLength: 900,
        maxFileSize: 4096 * 1000,
        maxFiles: 3,
        md5: true,
        tmpDir: "C:/Users/IsaacG/db/zaela/tmp",
        filesDir: "C:/Users/IsaacG/db/zaela/images",
        thumbSuffix: "_thumb",
        thumbWidth: 150,
        defaultName: "Anonymous",
        threads: {
            requireSubject: true,
            requireContent: false,
            requireFiles: true,
        },
        replies: {
            requireContentOrFiles: true,
        }
    }
};