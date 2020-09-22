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
import Knex from 'knex';
import { UserStatus } from '../enums/UserStatus';
import knex from '../knex';

import {getArgs} from '../utils';

const UserEntries = () => knex('User');

const router = express.Router();
router.route('/')
    .post(async (request, response) => {
      const {RqUid,query,currentPage,perPage} = getArgs(request);

      const entries = await UserEntries().select().where((builder: Knex.QueryBuilder) => {
        for (let index = 0; index < query.length; index++) {
          builder.where((innerBuilder: Knex.QueryBuilder) => {
            for (const [key, value] of Object.entries(query[index]))
              innerBuilder.orWhere(key,'ilike', `%${value}%`);
          });
        }
      }).where({status: UserStatus.APPROVED}).orderBy('createdAt','asc').paginate({ perPage, currentPage });

      // TODO(ak239spb): nice way to handle database errors.

      response.status(200).json({RqUid, entries}).end();
    });

export { router as ProfileController};
