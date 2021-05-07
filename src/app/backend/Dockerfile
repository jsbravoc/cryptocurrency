# https://nodejs.org/fr/docs/guides/nodejs-docker-webapp/


FROM node:10 as build

WORKDIR /backend
COPY ./package*.json ./
RUN npm install --loglevel verbose
COPY . .

EXPOSE 3000

CMD [ "node", "bin/www" ]



# WORKDIR /build/app/transaction_processor
# COPY ./build/app/transaction_processor/package*.json ./
# RUN npm install --loglevel verbose


# WORKDIR /backend
# COPY ./build/app/backend/ .

# WORKDIR /transaction_processor
# COPY ./build/app/transaction_processor/ .

# FROM node:10

# WORKDIR /usr/src/app

# COPY --from=build /backend .



# FROM node:10

# WORKDIR /usr/src/app

# COPY --from=build /backend .

# EXPOSE 3000

# CMD [ "node", "bin/www" ]