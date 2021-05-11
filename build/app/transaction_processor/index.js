/*! cryptocurrency 2021-05-11 */
"use strict";require("dotenv").config();const{TransactionProcessor}=require("sawtooth-sdk/processor"),TPHandler=require("./handler"),TPKeyHandler=require("./helpers/TPKeyHandler"),{logFormatted}=require("./utils/logger"),transactionProcessor=new TransactionProcessor(process.env.VALIDATOR||"tcp://localhost:4004");transactionProcessor.addHandler(new(TPKeyHandler(TPHandler))),transactionProcessor.start(),logFormatted(`Transaction processor available at ${process.env.VALIDATOR||"tcp://localhost:4004"}`),process.once("SIGUSR2",function(){transactionProcessor._handleShutdown(),process.kill(process.pid,"SIGUSR2")});