module.exports = {

  // Options: "production", "development"
  // You could also set this to process.env.NODE_ENV
  // then start the server as NODE_ENV=production node server.js
  // Will default to production if null
  // Always set to production when deploying (enables caching, etc)
  env: process.env.NODE_ENV,

  // Enable when behind a reverse proxy (which you should be)
  // Be sure to configure X-FORWARDED-FOR properly in your web server
  // If unset, all IPs will appear as "127.0.0.1", and banning users, cooldowns and rate limits won't work
  // You can test this by setting the log level to "debug" on a particular API while behind a reverse proxy
  // and ensuring the IP prints the correct address
  proxy: true,

  enableLogging: true,
  // Remember, database timeouts are 500 internal server errors
  // The following options will spam log writes and seriously impact performance should your database backlog with requests
  // Consider these for debugging purposes
  logInternalErrors: false,
  consoleErrors: false,
  // Used as the name of the website in templates
  webname: "ZChan",

  // Static files dir, null for the root of the the server (default)
  staticDir: null,

  // A connection pool is used for all SQL queries
  // Read up on connection pools to understand these sections

  database: {
    // WARNING: this will print all SQL packets to stdout
    // never enable on a site with any traffic
    debug: false,
    // The number of connections avaiable in the pool
    // Generally increase as you see more concurrent users
    connectionLimit: 5,
    // How long until a waiting connection should timeout (ms)
    connectionTimeout: 6000,
    // Timeout waiting to obtain a connection from the pool (ms)
    acquireTimeout: 10000,
    // Use memory instead of redis - for development /only/
    memStore: false,
  },

  /* SERVERS */
  // The "url" section is configured so the frontend links to this url instead of your host/port
  // e.g. if you are reverse proxying https traffic from api.mysite.com to localhost:3100
  // enter "https://api.mysite.com" as the url in api and disable https

  // All logs will open via append, so you can set them all to the same if you wish
  // Ensure the log directory is created and the server has permissions to write out
  // Refer to global log configuration at top of file

  /* Possible log levels (500 errors are globally controlled by 'logInternalErrors'): 
    "debug": log all traffic data and time taken
    "timing": log all traffic time taken
    null: No logging
  */

  // Serves rendered templates, the front of your site
  site: {
    port: 80,
    host: "localhost",
    // URLs used by the site to serve files and submit posts 
    apiUrl: "http://localhost:3000",
    filesUrl: "http://localhost:3200",
    // Used in title element and home page
    webname: "Test",
    log: "/var/log/zchan/site.log",
    logLevel: null
  },

  // Serves JSON data, handles post submissions
  api: {
    port: 3000,
    host: "localhost",
    log: "/var/log/zchan/api.log",
    // Important: This sets the Access-Control-Allow-Origin header, https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    // Javascript post submissions will not work without CORS enabled so set this to the URL of the site server
    // Null for no header set, otherwise any value will be directly set into the header
    allowCors: "https://localhost",
    logLevel: "timing"
  },

  // Handles user authentication, CRUD admin/mod operations
  auth: {
    port: 3100,
    host: "localhost",
    log: "/var/log/zchan/auth.log",
    logLevel: null,
    allowCors: "https://localhost",
    allowCorsCredentials: true,
  },

  // File server
  files: {
    host: "localhost",
    port: 3200,
    log: "/var/log/zchan/files.log",
    allowCors: null,
    logLevel: "timing"
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
    filesDir: "/var/www/files",
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