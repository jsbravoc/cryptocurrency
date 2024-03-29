"use strict";
require("./utils/init");
require("dotenv").config();

const { TransactionProcessor } = require("sawtooth-sdk/processor");
const TPHandler = require("./handler");
const TPKeyHandler = require("./helpers/TPKeyHandler");
const { logFormatted } = require("./utils/logger");

const transactionProcessor = new TransactionProcessor(process.env.VALIDATOR);

transactionProcessor.addHandler(new (TPKeyHandler(TPHandler))());

transactionProcessor.start();

logFormatted(`Transaction processor registered to ${process.env.VALIDATOR}`);

//Gracefull shutdown with nodemon
process.once("SIGUSR2", function () {
  transactionProcessor._handleShutdown();
  process.kill(process.pid, "SIGUSR2");
});

/**
 * Copyright 2016 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */
