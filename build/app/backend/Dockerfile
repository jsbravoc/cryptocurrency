# https://nodejs.org/fr/docs/guides/nodejs-docker-webapp/


FROM node:10 as build
RUN npm install pm2 -g
WORKDIR /backend
COPY ./package*.json ./
COPY ./ecosystem.config.js ./
RUN npm install --production
COPY . .

EXPOSE 3000

CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]