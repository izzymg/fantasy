# Fantasy

#### Imageboard/BBS API with NodeJS, MariaDB and Redis

Live instance: [https://fantasyvhs.net](https://fantasyvhs.net)

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

##### TODO

* Antispam
* More administration functions
* Support webms
* Captchas
* Secondary image processor
* Support Postgres

Full usage documentation to come.

## Server setup

Install NodeJS 10+

Install MariaDB (MySQL should work, however it is untested. PostgreSQL is unsupported currently.) and Redis.

Create a database in MariaDB called `fantasy`, and a user privileged to write, read and create tables on it.

`cd sql` `mysql -u dbUser -p fantasy < server/sql/schema.sql` will run a set of `CREATE x IF NOT EXISTS` commands. 

Do the same with `setup.sql` to generate an administrator, boards, report levels and so on.

Warning: The username/password is admin/admin, obviously you need to change this before your site goes live.

Remove `.default` from files in `server/config` directory and edit them

For production, set config.js `proxy: true`, set your front facing URLs and CORS options correctly.

Set the ports for all servers to unexposed (not public facing) options.

Also be sure to set the final files directory to be served by your web server. Note the temp directory also.

Setup nginx or another web server to forward a traffic to the unexposed API port, ensure `X-FORWARDED-FOR` is configured in nginx for fantasy to read the IP address of users.

`make` or `cd server` `npm i` to pull in dependencies.

Winodws Note: You may need `npm i node-gyp -g` due to Bcrypt or Sharp dependencies failing to compile, however this is not usually the case on modern Node versions.

## Start server

`node server/api/api.js`

## Documentation

[API Routes](server/docs/routes.md)

## License

GPL-V3.0. Do what you want with this - it's specifically purposed towards my personal needs so forking and editing is a good idea.