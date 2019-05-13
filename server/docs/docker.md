# Docker

There is a `docker-compose.yml` file in the root of this repository. It specifies MariaDB and Redis images as well as building `server/Dockerfile`, a Node 10 image.

## Environment setup

You'll need to create a `.env` file (it's in .gitignore) for `docker compose` and list the following

1. `MYSQL_USER` A user to create
2. `MYSQL_PASSWORD` The user's password
3. `MYSQL_DATABASE` The database to create
4. `MYSQL_ROOT_PASSWORD` Root's password
5. `HOST_DATA_DIR` The host directory that will mount as a volume for fantasy's data

Then add any and all environment variables required for configuring fantasy if you wish, or just add them straight into api/config/config.js.

To add an environment variable to JS config files, use `process.env.XYZ`, where `XYZ` is the environment variable sourced. The default configuration uses optional environment variables for the temp and files directory, db and redis urls, host and port and node_env, with defaults if not provided.

## Database access

Redis and MariaDB are accessible by default at `redis://redis` and `mysql://[user]:[password]@mariadb/[db]` inside the Docker container.

## Example .env file

```
# Docker MariaDB

MYSQL_USER=fantasy
MYSQL_PASSWORD=fantasy
MYSQL_DATABASE=test
MYSQL_ROOT_PASSWORD=root

# Docker host directory to map to container /data

HOST_DATA_DIR=D:\IZZY\data

# Fantasy

HOST=0.0.0.0
PORT=3000
NODE_ENV=development

# Container directory (will map to HOST_DATA_DIR)

FILES_DIR=/data/files
THUMBS_DIR=/data/THUMBS_DIR
TMP_DIR=/tmp

REDIS_URL=redis://redis
DB_URL=mysql://fantasy:fantasy@mariadb/test

```


## Running

Run `docker-compose up --build`, then once complete and running, `docker exec -it fantasyapi bash` to get a shell in the container and run `node /usr/src/fantasy/tools/setup.js` to generate the tables.