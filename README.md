# ZThree
##### In need of rename

Imageboard/BBS written in NodeJS with Koa and MySQLJS/MySQL

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

#### Development

Developed in VS Code and tested with MariaDB, Firefox & Chrome

ESLint included - Semicolons, unix style/LF line endings, double quotes, spaces.

`npm run lint` 

`npm run watch-css`

#### Getting started

You must go to the ./config directory and change remove the .default from all filenames.

All configuration files are simple Javascript files that set module.exports to an object containing config options.

All configuration files are commented with explanations on each value.

Read through the configurations, many options may be unsafe for production.

In your MySQL client, connect to your database instance and run `create database zthree`

Then in your terminal, run `mysql -h [yourdbhost.com] -u [username] -p zthree < ./setup.sql`

This will run a set of CREATE TABLE commands

`npm run build-css`

`npm start` or `node ./server.js`