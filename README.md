# Fantasy

#### Imageboard/BBS with NodeJS, MariaDB, Redis, VueJS

This is a modern imageboard/BBS focused on ease of development and modern user-experience, while still retaining the feel of chan-style imageboards. The API is (currently) written entirely in NodeJS while the client is written in Vue, JSON is used for data transfer and the API sticks as close to a RESTful service as possible while still using server-side session storage.

This git is setup as a monorepo for all fantasy related projects.

Live instance: [https://fantasyvhs.net](https://fantasyvhs.net)


##### Features

* Posting cooldowns
* Automatic thread deletion on board cap
* Thread bumps and bump limit
* Optional tripcodes
* Reports, bans, post deletion
* Anonymous only posting, accounts are only for administration
* Multiple image upload support (configurable)
* Automatic thumbnail processing with Sharp

##### TODO

* Antispam
* More administration functions
* Support webms
* Captchas
* Secondary image processor
* Support Postgres

## Overall setup

Install NodeJS 10+ (you can probably get away with 8) and npm.

If on Linux there's a convenient Makefile in the root, run `make`, which will call the Makefile in each project. Otherwise just cd into `server` and `client` and run npm install to pull in the dependencies.

*Windows Note*: You may need `npm i node-gyp -g` due to Bcrypt or Sharp dependencies failing to compile, however this is not usually the case on modern Node versions.

## Server setup

Setup MariaDB (MySQL should work, however it is untested. PostgreSQL is unsupported currently.) and Redis somewhere.

Create a database in MariaDB, and a user privileged to write, read and create tables on it.

Remove `.default` from files in `server/config` directory and edit them, set your Redis and MariaDB connection urls.

Fantasy's API will use `X-FORWARDED-FOR` when `config.proxy = true`, ensure these are correct when behind a reverse proxy, or any IP addresses recorded will be on 127.0.0.1 (all reports and bans would just ban your server).

Also be sure to set the final files directory to be served by your web server. Note the temp directory also.

`cd server` and `npm run setup` to create all of the tables fantasy requires (also a good way to test your DB connection is working without booting the server). It will call `node server/tools/setup.js`. **Be careful**, it creates a user named **admin** with the password **admin** and inserts a report level.

*SQL setup note*: The SQL schema for fantasy is reflected in server/sql/schema.sql - a more readable copy of what's in server/tools/setup.js. *If you don't want to run `setup`* and generate an admin user, and just want the tables, you can  just run `mysql -u (user) -p (database) < server/sql/schema.sql`.

## Start server

`cd server; npm start` or `node server/api/api.js`

If `config.healthCheck = true` (default true) the server will check your log level is supported, try opening the log file, test its MariaDB and Redis connections, and try opening the temp and files directory for writing before starting the HTTP server, crashing with a verbose error message if a critical failure occurs. 

## Documentation

[API Routes](server/docs/routes.md)

## License

GPL-V3.0. Do what you want with this - it's specifically purposed towards my personal needs so forking and editing is a good idea.