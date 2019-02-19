module.exports = {

  // Options: "production", "development"
  // You could also set this to process.env.NODE_ENV
  // then start the server as NODE_ENV=production node server.js
  // Will default to production if null
  // Always set to production when deploying (enables caching, etc)
  env: process.env.NODE_ENV,

  enableLogging: true,
  // Remember, database timeouts are 500 internal server errors
  // The following options will spam log writes and seriously impact performance should your database backlog with requests
  // Consider these for debugging purposes
  logInternalErrors: false,
  consoleErrors: false,
  // Used as the name of the website in templates
  webname: "ZChan",

  // A connection pool is used for all SQL queries
  // Read up on connection pools to understand these sections

  database: {
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

  // Serves rendered templates, the front of your site
  site: {
    port: 80,
    host: "localhost",
    https: false,
    httpsPort: 8080,
    url: "http://localhost",
    log: "/var/log/zchan/site.log",
  },

  // Serves JSON data, handles post submissions
  api: {
    port: 3000,
    host: "localhost",
    https: false,
    httpsPort: 3080,
    url: "http://localhost:3080",
    log: "/var/log/zchan/api.log",
    // Allows cross-origin resource sharing
    allowsCors: false,
  },

  // File server
  files: {
    host: "localhost",
    port: 3180,
    https: false,
    httpsPort: 3180,
    url: "http://localhost:3180",
    log: "/var/log/zchan/files.log",
    allowCors: false,
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