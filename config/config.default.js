module.exports = {
    // A connection pool is used for all SQL queries
    // Read up on connection pools to understand these sections
    database: {
        // The number of connections avaiable in the pool
        // Generally increase as you see more concurrent users
        connectionLimit: 20,
        // How long until a waiting connection should timeout (ms)
        connectionTimeout: 6000,
        // Timeout waiting to obtain a connection from the pool (ms)
        acquireTimeout: 10000,
        // Spams STDOUT with sql packets
        debug: false,
        // On db close, print and log information about the connection pool
        metrics: false,
        // Use memory instead of redis - for development /only/
        memStore: false,
    },

    // Protects the servers to require the privateKey in a cookie to serve any routes
    // Users can generate a cookie by going to (api)/private and entering the password
    apiPrivate: false,
    sitePrivate: false,
    filesPrivate: false,
    privatePassword: "VerySecretPassword123",
    privateKey: require("crypto").randomBytes(16).toString("hex"),

    // Serves rendered templates, the front of your site
    server: {
        port: 80,
        host: "zchan.net",
        https: true,
        httpsPort: 8080,
        // Log file, ensure permissions
        log: "/var/log/zchan.log",
        // Print errors (usually 500 internal server errors) to console (will still be logged)
        consoleErrors: false,
        // Used as the name of the website in templates
        webname: "ZChan",
    },

    // Serves JSON data, handles post submissions
    api: {
        port: 80,
        host: "api.zchan.net",
        https: true,
        httpsPort: 8080,
    },

    // File server
    files: {
        host: "localhost",
        port: 3100,
        https: true,
        httpsPort: 3180
    },

    // Configuration of posts
    posts: {
        maxNameLength: 16,
        maxSubjectLength: 60,
        maxContentLength: 900,
        // Bytes
        maxFileSize: 4096 * 1000,
        // Max files uploaded per post
        maxFiles: 3,
        // Store an MD5 hash of the image?
        md5: true,
        // Where to write temporary files
        tmpDir: "/tmp",
        // Where to store files
        filesDir: "/var/www/zchan/files",
        // Appended on the end of thumbnails
        thumbSuffix: "_thumb",
        // Used to scale thumbnails if need be
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