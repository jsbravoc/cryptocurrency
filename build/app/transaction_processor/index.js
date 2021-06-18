"use strict";require("./utils/init"),require("dotenv").config();const{TransactionProcessor}=require("sawtooth-sdk/processor"),TPHandler=require("./handler"),TPKeyHandler=require("./helpers/TPKeyHandler"),{logFormatted}=require("./utils/logger"),transactionProcessor=new TransactionProcessor(process.env.VALIDATOR);transactionProcessor.addHandler(new(TPKeyHandler(TPHandler))),transactionProcessor.start(),logFormatted(`Transaction processor registered to ${process.env.VALIDATOR}`),process.once("SIGUSR2",function(){transactionProcessor._handleShutdown(),process.kill(process.pid,"SIGUSR2")});