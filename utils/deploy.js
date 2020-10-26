#!/usr/bin/env node
/**
 * Copyright (c) Mesto.co
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const core = require('@actions/core');
const fs = require('fs');
const AWS = require('aws-sdk');

try {
  const functionName = process.env['FUNCTION_NAME'];
  const AWS_SECRET_KEY = process.env['AWS_SECRET_KEY'];
  const AWS_SECRET_ID = process.env['AWS_SECRET_ID'];
  const AWS_REGION = process.env['AWS_REGION'];

  const zipBuffer = fs.readFileSync(`./lambda.zip`);
  const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: AWS_REGION,
    secretAccessKey: AWS_SECRET_KEY,
    accessKeyId: AWS_SECRET_ID,
    maxRetries: 3,
    sslEnabled: true,
    logger: console,
  });
  const params = {
    FunctionName: functionName,
    Publish: true,
    ZipFile: zipBuffer,
  };
  lambda.updateFunctionCode(params, err => {
    if (err) {
      console.error(err);
      core.setFailed(err);
    }
  });
} catch (error) {
  core.setFailed(error.message);
}
