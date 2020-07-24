FROM node:14

# Working directory of the app to start running 
RUN mkdir /app

WORKDIR /app

# Main executor
RUN npm install -g nodemon

# Dependencies
COPY package.json package.json

# Install dependencies
RUN npm install && mv node_modules /node_modules

COPY . .

LABEL maintainer="Sreeni <sreeni.hari@gmail.com>"

# Port to expose to host
EXPOSE 3000

# Run with API key always to access Github GraphQL API
CMD APIKEY=$APIKEY node server.js
