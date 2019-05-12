FROM node:10

RUN mkdir -p /usr/src/fantasy
WORKDIR /usr/src/fantasy

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "test" ]