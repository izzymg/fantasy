FROM node:10

RUN mkdir -p /usr/src/fantasy_server
WORKDIR /usr/src/fantasy_server

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD [ "node", "api/api.js" ]