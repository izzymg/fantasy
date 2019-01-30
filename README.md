# ZThree
##### In need of rename

Imageboard/BBS written in NodeJS

#### Dependencies:

Node v8+ is required due to usage of ES6

Run `npm install` once you've installed NodeJS and npm to automatically pull in these deps

* koa
* koa-ejs
* koa-router

#### Development

Developed in VS Code and tested with MariaDB, Firefox & Chrome

ESLint included - Semicolons, unix style/LF line endings, double quotes, spaces.

`npm run lint` 

#### Getting started

You must go to the ./config directory and change remove the .default from all filenames, or the server will crash on startup.

Read through the configurations, many options may be unsafe for production. They are written in JS so comments and explanations are there.

`npm start` or node ./server.js