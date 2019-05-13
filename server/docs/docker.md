# Docker

There is a `docker-compose.yml` file in the root of this repository. It specifies MariaDB and Redis images as well as building `server/Dockerfile`, a Node 10 image.

You'll need to create a `.env` file (it's in .gitignore) for `docker compose` and list the following

1. `MYSQL_USER` A user to create
2. `MYSQL_PASSWORD` The user's password
3. `MYSQL_DATABASE` The database to create
4. `MYSQL_ROOT_PASSWORD` Root's password
5. `HOST_DATA_DIR` The host directory that will mount as a volume for fantasy's data

Then ensure fantasy's secrets.js and config.js point to environment variables (use process.env.XYZ) for the port, host redis and mysql connection URLs.

Redis and MariaDB are accessible by default at `redis://redis` and `mysql://[user]:[password]@mariadb/[db]` inside the Docker container.

Run `docker-compose up --build`, then once complete and running, `docker exec -it fantasyapi bash` to get a shell in the container and run `node /usr/src/fantasy/tools/setup.js` to generate the tables.