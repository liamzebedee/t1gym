FROM node:12-alpine

RUN mkdir -p /app

WORKDIR /app

# Install node modules.
ADD package.json /app/package.json
RUN yarn

ADD . /app

RUN npm run build

CMD npm run start