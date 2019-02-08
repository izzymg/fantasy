# ZThree
##### In need of rename

Imageboard/BBS written in NodeJS with Koa, MySQLJS/MySQL and Redis

Tested only on MariaDB - not currently safe for production

#### Dependencies:

Node v8+ is required due to usage of ES6

Run `npm install` once you've installed NodeJS and npm to automatically pull in these deps

* koa
* busboy
* sharp
* pug
* mysql
* sass
* uuid
* node-redis

#### Development

Developed in VS Code and tested with Node v10, MariaDB, Firefox & Chrome

ESLint included - Semicolons, unix style/LF line endings, double quotes, spaces.

`npm run lint` 

`npm run watch-css`

#### Getting started

##### Configuration

You must go to the ./config directory and change remove the .default from all filenames.

All configuration files are simple Javascript files that set module.exports to an object containing config options.

Read through the configurations, many options may be unsafe for production.

##### SQL

Connect to your MySQL server (`mysql -h [yourdbhost] -u [username] -p`) and run `create database zthree`

Then exit, and in your terminal run `mysql -h [yourdbhost] -u [username] -p zthree < ./setup.sql`

This will run a set of `CREATE TABLE IF NOT EXIST` commands to setup the board's tables in the database.

Enter your database credentials in `secrets.js` configuration's "database" section.

##### Redis

Redis is used for storing session state and managing IP post-cooldowns. Support for SQLite (and in-memory for testing purposes only) is planned.

Start a redis server, configure a password for it. Then enter the host, user and password into the `secrets.js` file's "Redis" section.

##### Users

You can generate an administrator user by running `node ./generateAdmin.js [username] [password]`

##### Starting the server

Run this command to compile the sass files into css `npm run build-css`

`npm start` or `node ./server.js` to boot the server