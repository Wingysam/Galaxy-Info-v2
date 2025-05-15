FROM node:22

WORKDIR /app
COPY ./shared/ ./shared/
COPY ./server/ ./server/

WORKDIR /app/server

RUN npm install && npx prisma generate && npm run build

CMD node dist/index.js