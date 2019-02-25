# ZThree

Imageboard/BBS written in NodeJS with Koa, MySQLJS/MySQL and Redis

Tested only on MariaDB - not currently safe for production

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

#### Getting started

#### Configuration

Under /config:

Rename `config.default.js` to `config.js`

Rename `private.default.js` to `private.js`

Read through the configurations, some options may be unsafe for production.

#### Static (Frontend)

The static files have their own package.json and node_modules to keep things tidy.

Currently the imageboard's frontend is extremely simple with zero Javascript, a Vue frontend is in planning.

cd into `static/` and run `npm install` to pull in [Sass](https://sass-lang.com/)

`npm build`

Don't rename/delete any templates as currently the site server is dependent on their existence. However you can edit them as much as you'd like. They are written in [Pug](https://pugjs.org/api/getting-started.html).

*Important:* Anything placed in the /static/dist folder will be served to the user. You could for example place "banner.png" there, then edit a template to serve `img(src="/banner.png")`

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

This forces linked images and calls to the API to go through that domain, rather than the actual host and port used by the server.

In other words, an `<img>` tag will link to `images.yoursite.com` rather than `localhost:4050`

You should then setup your proxy to forward traffic from `images.yoursite.com` to `localhost:4050`

#### Starting the server

`npm start` or `node ./server.js` to boot the server