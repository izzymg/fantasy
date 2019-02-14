module.exports = {
    database: {
        connectionLimit: 1,
        connectionTimeout: 6000,
        acquireTimeout: 10000,
        debug: false,
        metrics: false,
        memStore: false,
    },

    server: {
        port: 3000,
        host: "zchan.net",
        https: true,
        httpsPort: 3001,
        log: "C:/db/z.log",
        consoleErrors: true,
        webname: "ZChan",
    },

    api: {
        port: 3002,
        host: "api.zchan.net",
        https: true,
        httpsPort: 3003,
    },

    files: {
        enabled: true,
        host: "localhost",
        port: 3100,
        https: false,
        httpsPort: 3180
    },

    posts: {
        maxNameLength: 16,
        maxSubjectLength: 60,
        maxContentLength: 900,
        maxFileSize: 4096 * 1000,
        maxFiles: 3,
        md5: true,
        tmpDir: "/tmp",
        filesDir: "/var/www/zchan/files",
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