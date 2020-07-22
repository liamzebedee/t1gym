FROM node:13-alpine

RUN mkdir -p /app

WORKDIR /app

# Install node modules.
ADD package.json /app/package.json
RUN npm install

ADD . /app

CMD npm run start -p $PORT