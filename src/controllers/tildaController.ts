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
import knex from '../knex';
import { getArgs } from '../utils';

const {tildaToken} = require('../../config.js');

const tildaRouter = express.Router();
tildaRouter.route('/')
    .post(async (request, response) => {
      try {
        const args = getArgs(request);
        if (args.token !== tildaToken || !tildaToken)
          return response.status(401).end();
        delete args.token;
        await knex.raw('INSERT INTO tilda (data) VALUES (:data)', {data: JSON.stringify(args)});
        response.status(200).json({}).end();
      } catch (e) {
        console.debug('POST tilda error', e);
        response.status(500).json({}).end();
      }
    });

export { tildaRouter};

