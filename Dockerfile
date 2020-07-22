FROM node:13-alpine

RUN mkdir -p /app

ADD . /app
WORKDIR /app

RUN npm install

EXPOSE 3000

CMD npm run start -p $PORT