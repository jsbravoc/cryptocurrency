FROM node:10 as build
RUN npm install pm2 -g
WORKDIR /transaction_processor
COPY ./package*.json ./
RUN npm install --production
COPY . .

EXPOSE 4004

CMD [ "pm2", "start" ]