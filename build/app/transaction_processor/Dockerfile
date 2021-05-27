FROM node:10 as build
RUN npm install pm2 -g
WORKDIR /transaction_processor
COPY ./package*.json ./
COPY ./ecosystem.config.js ./
RUN npm install --production
COPY . .

CMD [ "pm2-runtime", "start" ]