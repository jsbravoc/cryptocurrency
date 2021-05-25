# https://nodejs.org/fr/docs/guides/nodejs-docker-webapp/


FROM node:10 as build
RUN npm install pm2 -g
WORKDIR /backend
COPY ./package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3000

CMD [ "pm2", "start" ]