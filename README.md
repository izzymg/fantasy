# Fantasy

#### Imageboard/BBS API with NodeJS, MariaDB and Redis

Live instance: [https://fantasyvhs.net](https://fantasyvhs.net)

[Vue Frontend for Fantasy](https://github.com/izzymg/zv)

##### Features

* Posting cooldowns
* Automatic thread deletion on board cap
* Thread bumps and bump limit
* Optional tripcodes
* Reports
* Anonymous only posting, accounts only for administration
* Secure administration, post deletion and bans
* Exposed JSON API 
* Multiple image upload support (configurable)
* Automatic thumbnail processing with Sharp
* Designed with being run behind a reverse proxy in mind

##### TODO
* Automatic antispam
* More administration functions
* Support webms
* Captchas
* Performance improvements (faster sql file joins)
* Store MD5 hash of images

Full usage documentation to come.

## Setup

You need NodeJS 8.5.0 *minimum*, but it was written and tested predominantly on Node 10 and 11. Fantasy makes heavy usage of async/await and some newer methods provided by fs/util etc.

Install MariaDB (Postgres should work, but untested) and Redis. Create a database in MariaDB called `fantasy`, and a user privileged to write, read and create tables on it.

`cd sql` `mysql -u dbUser -p fantasy < schema.sql` will run a set of `CREATE x IF NOT EXISTS` commands. 

Do the same with `setup.sql` to generate an administrator, boards, report levels and so on.

Warning: The username/password is admin/admin, obviously you need to change this before your site goes live.

Remove `.default` from files in `./config` directory and setup

Make sure to disable the file server in production, set config.js `proxy: true`, set your front facing URLs and CORS options correctly. Set the ports for all  servers to unexposed (not public facing) options.

Also be sure to set the final files directory to be served by your web server. Note the temp directory also.

Setup nginx or another web server to forward a traffic to the unexposed API port, ensure `X-FORWARDED-FOR` is configured in nginx for fantasy to read the IP address of users.

`npm install` to pull in dependencies, you may need `npm i node-gyp -g` if it fails on windows due to bcrypt or sharp

## Deploying

[Get the Vue.JS frontend here](https://github.com/izzymg/zv)

Grab a process manager like pm2 and put fantasy.js under it if that's your style, or roll with docker etc.

`npm run test`

## License

GPL-V3.0. Do what you want with this - it's specifically purposed towards my personal needs so forking and editing is a good idea.