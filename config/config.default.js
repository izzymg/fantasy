// Zthree config
// It is recommended in production you configure a reverse proxy to serve the routes
// To do so, disable all https and set the "url" options to match your domains
// including protocol, and port if necessary, e.g. api: { ... url: https://api.(mysite.com) }
// This will be used to for linking files and requests to the API
// Set the port to unexposed local ports and the host to localhost
// Then configure your web server to serve them, e.g. api.(yoursite.com) -> localhost:3100

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
        port: 3000,
        host: "localhost",
        https: false,
        httpsPort: 3043,
        // Important for reverse proxies - used to link within page
        // e.g. site hosted on localhost but links images at https://files.yoursite.net
        url: "https://zchan.net",
        // Log file, ensure permissions
        log: "/var/log/zchan.log",
        // Print errors (usually 500 internal server errors) to console (will still be logged)
        consoleErrors: false,
        // Used as the name of the website in templates
        webname: "ZChan",
    },

    // Serves JSON data, handles post submissions
    api: {
        port: 3100,
        host: "https://api.zchan.net",
        https: false,
        httpsPort: 3143,
        url: "api.zchan.net",
    },

    // File server
    files: {
        host: "localhost",
        port: 3200,
        https: false,
        httpsPort: 3243,
        url: "https://files.zchan.net",
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