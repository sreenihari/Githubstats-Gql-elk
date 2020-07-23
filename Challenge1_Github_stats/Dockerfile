FROM node:14

RUN mkdir /app
WORKDIR /app

RUN npm install -g nodemon

COPY package.json package.json
RUN npm install && mv node_modules /node_modules

COPY . .

LABEL maintainer="Sreeni <sreeni.hari@gmail.com>"

EXPOSE 3000
CMD APIKEY=$APIKEY node server.js
