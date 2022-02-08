# import node-js v16.13.2
FROM node:16.13.2

# create workspace directory
WORKDIR /app

# copy package json and install dependencies
COPY package.json .
RUN npm install

# copy all other source files to the app directory
ADD . /app

# build the typescript project
RUN npm run build

# start the container
CMD [ "npm", "run", "start" ]