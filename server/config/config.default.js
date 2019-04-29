module.exports = {

  // Options: "production", "development"
  // You could also set this to process.env.NODE_ENV
  // then start the server as NODE_ENV=production node server.js
  // Always set to production when deploying (enables caching, etc)
  env: process.env.NODE_ENV || "production",

  // Enable when behind a reverse proxy (which you should be)
  // Be sure to configure X-FORWARDED-FOR properly in your web server
  // If unset, all IPs will appear as "127.0.0.1", and banning users, cooldowns and rate limits won't work
  // You can test this by setting the log level to "debug" on a particular API while behind a reverse proxy
  // and ensuring the IP prints the correct address
  proxy: true,
  // "fatal": log crashes (good idea)
  // "error": log 500 server errors (if your database goes down this will spam your logs every request)
  // "info": log requests (if you're working on the code this can be useful)
  // You could set this to process.env.LOG_LEVEL and start the server with LOG_LEVEL=fatal node fantasy.js
  logLevel: process.env.LOG_LEVEL || "fatal",
  logFile: process.env.LOG_FILE || "/var/log/fantasy.log",

  // Send any "error" or "fatal" to stdout? (good for debugging)
  consoleLogErrors: false,

  // Check db connection and server health on start
  healthCheck: true,

  // Dev option
  noRedis: false,

  // A connection pool is used for all SQL queries
  // Read up on connection pools to understand these sections

  database: {
    // WARNING: this will print all SQL packets to stdout
    debug: false,
    // The number of connections avaiable in the pool
    // Generally increase as you see more concurrent users
    connectionLimit: 5,
  },

  api: {
    port: process.env.PORT || 8080,
    host: process.env.HOST || "localhost",
    // Important: This sets the Access-Control-Allow-Origin header, https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    // Javascript post submissions will not work without CORS enabled so set this to the URL of the site server
    // Null for no header set, otherwise any value will be directly set into the header
    allowCors: "https://localhost",
    allowCorsCredentials: true,
  },

  // Configuration of posts
  posts: {
    defaultName: "Anonymous",
    // Where to write temporary files
    tmpDir: process.env.TMP_DIR || require("os").tmpdir(),
    // Where to store files
    filesDir: process.env.FILES_DIR || "/var/www/files",
    // Where to store thumbnails
    thumbsDir: process.env.THUMBS_DIR || "/var/www/thumbnails",
    enableTripcodes: true,
    // https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options
    // Use openssl list -digest-algorithms
    tripAlgorithm: "md5",
    tripSalt: "veryimportantsalt",
    maxNameLength: 16,
    maxSubjectLength: 60,
    maxContentLength: 900,
    // Bytes
    maxFileSize: 4096 * 1000,
    // Max files uploaded per post
    maxFiles: 3,
    // Store an MD5 hash of the image?
    md5: true,
    // Used to scale thumbnails if need be
    thumbWidth: 150,
    thumbQuality: 40,
    // Time between reports in ms
    reportCooldown: 1000 * 60 * 30,
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