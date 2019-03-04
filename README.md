# ZThree

Imageboard/BBS written in NodeJS with Koa, MySQLJS/MySQL and Redis

Live instance: [https://fantasyvhs.net](https://fantasyvhs.net)

#### Dependencies:

Node v8+ is required due to usage of ES6

Run `npm install` once you've installed NodeJS and npm to automatically pull in these deps

* koa/sendfile/router/views/static
* busboy
* sharp
* pug
* mysql
* sass
* uuid
* node-redis
* bcrypt
* co-body

#### Development

Developed in VS Code and tested with Node v10, MariaDB, Firefox & Chrome

`npm run lint` 

#### Frontend
A static server side rendered version exists under `./static`, run `npm install` `npm build`

You can find a highly featured vue frontend at [https://github.com/izzymg/zv](https://github.com/izzymg/zv)

Pull this, change config.js to your site's API location


#### Configuration

Under /config:

Rename `config.default.js` to `config.js`

Rename `private.default.js` to `private.js`

Read through the configurations, some options may be unsafe for production.

#### SQL

Connect to your MySQL server (`mysql -h [yourdbhost] -u [username] -p`) and run `create database zthree`

Then exit, and in your terminal run `mysql -h [yourdbhost] -u [username] -p zthree < ./setup.sql`

That will execute all the commands inside "setup.sql" to create the tables. This will not overwrite already existing tables.

This will run a set of `CREATE TABLE IF NOT EXIST` commands to setup the board's tables in the database.

Enter your database credentials in `private.js` configuration's "database" section.

#### Redis

Redis is used for storing session state and managing IP post-cooldowns. Support for SQLite is planned.

Start a redis server, configure a password for it. Then enter the host, user and password into the `private.js` file's "Redis" section.

For testing *only*, an in-memory implementation can be enabled in the config option under "database": memStore

This just creates a Javascript object and is designed purely for testing on environments where Redis is unavailable, like Windows.

#### Production

It's optimal you serve this application via a reverse proxy such as nginx.

Start by setting all host and ports to unexposed, private options, for example the API might be `localhost:3000` and files at `localhost:4050`

Set the `url` section in all server configurations to the actual front facing domain you use.

You should then setup your proxy to forward traffic from `images.yoursite.com` to `localhost:4050`

#### Starting the server

`npm start` or `node ./server.js` to boot the server