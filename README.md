# ZThree
##### In need of rename

Imageboard/BBS written in NodeJS with Koa and MySQLJS/MySQL

Not currently safe for production

#### Dependencies:

Node v8+ is required due to usage of ES6

Run `npm install` once you've installed NodeJS and npm to automatically pull in these deps

* koa
* koa-views
* koa-router
* koa-static
* pug
* mysql

#### Development

Developed in VS Code and tested with MariaDB, Firefox & Chrome

ESLint included - Semicolons, unix style/LF line endings, double quotes, spaces.

`npm run lint` 

#### Getting started

You must go to the ./config directory and change remove the .default from all filenames.

All configuration files are simple Javascript files that set module.exports to an object containing config options.

All configuration files are commented with explanations on each value.

Read through the configurations, many options may be unsafe for production.

In your MySQL/Postgres instance, run `create database zthree`

Then in your terminal `mysql -u [username] -p zthree < setup.sql` to create the tables (non-destructive)

`npm start` or node ./server.js