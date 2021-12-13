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
import express from 'express';
import {getArgs} from '../utils';

const {
  amoToken
} = require('../../config.js');

const amoController = express.Router();
amoController.route('/')
    .get(async (request, response) => {
      const args = getArgs(request);
      if (args && args.token === amoToken) {
        console.debug('amoController#get', args);
        return response.status(200).json({}).end();
      }
      return response.status(401).json({}).end();
    })
    .post(async (request, response) => {
      const args = getArgs(request);
      if (args && args.token === amoToken) {
        console.debug('amoController#post', args);
        return response.status(200).json({}).end();
      }
      return response.status(401).json({}).end();
    });

export {
  amoController
};
