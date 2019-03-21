# Fantasy

#### RESTful Imageboard/BBS with NodeJS, MariaDB and Redis

Live instance: [https://fantasyvhs.net](https://fantasyvhs.net)

[Vue Frontend for Fantasy](https://github.com/izzymg/zv)

##### Features

* Posting cooldowns
* Automatic thread deletion on board cap
* Thread bumps and bump limit
* Optional tripcodes
* Anonymous only posting, accounts only for administration
* Secure administration, post deletion and bans
* Exposed JSON API 
* Multiple image upload support (configurable)
* Automatic thumbnail processing with Sharp
* Designed with being run behind a reverse proxy in mind

##### TODO
* Report system
* Automatic antispam
* More administration functions
* Store MD5 hash of images
* Support webms
* Captchas

Full usage documentation to come.

## Setup

Install MariaDB (Postgres should work, but untested) and Redis. Create a database in MariaDB called `fantasy`, and a user privileged to write, read and create tables on it.

`cd sql` `mysql -u dbUser -p fantasy < setup.sql` will run a set of `CREATE x IF NOT EXISTS` commands. 

`admin.sql` will create a user called admin, with the password of 'admin', and place them in the administrators table.

Remove `.default` from files in `./config` directory and setup

Make sure to disable the file server in production, set `proxy = true`, set your front facing URLs and CORS options correctly. Set the ports for all  servers to unexposed (not public facing) options.

Also be sure to set the final files directory to be served by your web server. Note the temp directory also.

Setup nginx or another web server to forward a traffic to the unexposed API port, ensure `X-FORWARDED-FOR` is configured in nginx for fantasy to read the IP address of users.

`npm install` to pull in dependencies, you may need `npm i node-gyp -g` if it fails on windows due to bcrypt or sharp

## Frontend

PHP SSR to come

[Get the Vue.JS frontend here](https://github.com/izzymg/zv)

Grab a process manager like pm2 and put server.js under it.

## API routes

This is a list of routes the API exposes.

Method | URL                                | Info (all content types JSON unless stated otherwise)                 
------ | ---------------------------------- | --------------------------------------------------------------------- 
GET    | /posts/:board/:post                | Returns a single post at :post                                          
POST   | /posts/:board/                     | Multipart: Create thread, { name, subject, content, any file fields } 
POST   | /posts/:board/:post                | Multipart: Create reply to :post, ignores subject                       
GET    | /posts/:board/threads              | Returns all threads at :board                                         
GET    | /posts/:board/threads/:post        | Returns { thread, replies }                                           
DELETE | /posts/:board/:post                | Deletes post :post on :board
POST   | /posts/report/:board/:post         | Reports post
PUT    | /posts/stick/:board/:post          | Sticks post
PUT    | /posts/unstick/:board/:post        | Unsticks post
GET    | /boards                            | Returns all boards                                                    
GET    | /boards/:board                     | Returns board :post information                                         
GET    | /boards/mod                        | Returns all board you moderate                                        
GET    | /boards/:board/reports             | Returns all reports on :board                                         
POST   | /auth/login                        | Expects { username, password }                                          
GET    | /auth/session                      | Returns { username }                                                  
POST   | /auth/changePassword              | Expected { currentPassword, newPassword, confirmationPassword }                                       
GET    | /bans                              | Returns your IP bans                                                  
POST   | /bans/:board/:post                 | Bans poster of :post from board                                         
