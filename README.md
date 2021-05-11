# Cryptocurrency

<div align="center">

![GitHub Repo stars](https://img.shields.io/github/stars/jsbravoc/cryptocurrency?style=social)
[![Build status](https://img.shields.io/circleci/build/github/jsbravoc/cryptocurrency?token=7ee902fdd4d28a5e30e21266f2101d7f11a0e0bb)](https://github.com/jsbravoc/cryptocurrency/releases/)
[![Coverage](https://codecov.io/gh/jsbravoc/cryptocurrency/branch/main/graph/badge.svg?token=V0OVR0D64N)](https://codecov.io/gh/jsbravoc/cryptocurrency)
![GitHub](https://img.shields.io/github/license/jsbravoc/cryptocurrency)

</div>

**[Hyperledger Sawtooth](https://www.hyperledger.org/use/sawtooth) blockchain application to handle a private cryptocurrency, featuring:**

- Transaction input validation to keep the cryptocurrency flow coherent (All non-coinbase transactions must be supported by another transaction).
- Pending transactions, such as a money transfer request from one user to another.
- User roles and permissions to use the cryptocurrency. For instance, **coinbase** permission to allow the creation of a coinbase (no input) transaction.
- Transaction tracking. Any transaction with corresponding input can be tracked down till the coinbase transaction. (Used to understand the flow and provenance of the cryptocurrency, thus avoiding its misuse).
- Transaction security. The API verifies the transaction & users' signatures in order to verify integrity and non-repudiation. 


## Components

This projects contains the following components, required to launch the application.

- [crypto-api](https://github.com/jsbravoc/cryptocurrency/tree/main/build/app/backend) - Express.js application which provides HTTP(S) JSON API to manage the cryptocurrency.

- [crypto-tp](https://github.com/jsbravoc/cryptocurrency/tree/main/build/app/transaction_processor) - Node.js application that handles the logic of the transactions between [crypto-api](https://github.com/jsbravoc/cryptocurrency/tree/main/build/app/backend) and Hyperledger Sawtooth's REST API.

## Requirements

This project requires [Docker](https://www.docker.com/why-docker), [npm](https://www.npmjs.com/get-npm) and [Node.js](https://nodejs.org/en/) <=10.23.3*. 

\* `backend` project uses `sawtooth-sdk^1.0.5`, which internally uses `zeromq^4.2.1`. Unfortunately, `zeromq^4.2.1` breaks on Node.js 11+.


## Installation & Usage

This application uses [Docker](https://www.docker.com/why-docker), used to simplify the installation and deployment of the whole application. Although the application can be started by using Node.js (i.e `node index.js`), Sawtooth's components (the validator, the REST API, etc) are started using Docker directly.

### Downloading the project

In order to download the project and start it locally, you need to clone this repository and go to the root directory of the project:

```sh
git clone https://github.com/jsbravoc/cryptocurrency.git
cd cryptocurrency
```

### Starting up the application

Once Docker is installed and you've cloned this repo, navigate to the root directory of the project and run:

```sh
cd blockchain_network/docker-compose-dev/sawtooth
docker-compose up
```

Then, you need to install `transaction_processor` node dependencies and start it: 

```sh
cd build/app/transaction_processor
npm install
npm start # or pm2 --name crypto-tp start npm -- start if using PM2
```

Finally, you need to install `backend` node dependencies and start it: 

```sh
cd build/app/backend
npm install
npm start # or pm2 --name crypto-api start npm -- start if using PM2
```

Optionally, if you want to see the API definitions, make sure to go to `localhost:3000/api-docs` or to the URL of where the application was started.


### Stopping the application

In order to stop the application you need to send SIGINT to the running processes. Therefore, you should use `^C` (`Ctrl + C`) on the terminals running any component of the application. If you are using PM2, then run:
```sh
pm2 stop crypto-api
pm2 stop crypto-tp
```


Please note that if you stopped the blockchain network on Docker, the correct way to start it up again is:
```sh
cd blockchain_network/docker-compose-dev/sawtooth
docker-compose up
```

Moreover, if you want to stop the blockchain network **and delete all of its contents**, you can execute:
```sh
cd blockchain_network/docker-compose-dev/sawtooth
docker-compose down
```

## Development & Testing

### Development:

In order to understand the functions used inside the `backend` component, please access to `localhost:3000/docs` or to the URL of where the application was started. There you will find the JS documentation of all the code. 


### Testing:

In order to test and use the API, please check the [Postman](https://www.postman.com/) collection available [here](https://github.com/jsbravoc/cryptocurrency/tree/main/build/app/backend).

Also, if you want to test the application directly, please go to `localhost:3000/api-docs` or to the URL of where the application was started. There, you will find a [Swagger UI](https://swagger.io/tools/swagger-ui/) application to test the API and see the API definitions.


### Contributing:

In order to develop and contribute to this repository, make sure to run the tests of the API before creating a pull request:

```sh
cd src/app/backend
npm test
```

## Contributors
[jsbravoc](https://github.com/jsbravoc)


## License
