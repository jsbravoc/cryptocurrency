FROM node:10 as build

WORKDIR /transaction_processor
COPY ./package*.json ./
RUN npm install --loglevel verbose
COPY . .

EXPOSE 4004

CMD [ "node", "index.js" ]