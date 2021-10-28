FROM node:16-alpine

ENV NODE_ENV production
WORKDIR /app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production=false --silent

COPY . .

RUN npm run build

CMD cd dist && node index.js