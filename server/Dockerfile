FROM node:10

RUN mkdir -p /usr/src/fantasy
WORKDIR /usr/src/fantasy

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD [ "node", "api/api.js" ]