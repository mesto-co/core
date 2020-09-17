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

import {getArgs} from '../utils';
const config = require('../../config.js');

/**
 * @typedef {Object} TestEntry
 * @property {number} fieldA
 * @property {string} fieldB
 *
 * @returns {Knex.QueryBuilder<TestEntry, {}>}
 */

const UserEntries = () => knex('User');

const router = express.Router();
router.route('/')
    .get(async (request, response) => {
      const {RqUid,query,currentPage} = getArgs(request);

      // TODO(ak239spb): nice way to handle database errors.
      const entries = await UserEntries().select()
          .whereRaw(`"firstName" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"lastName" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"middleName" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"username" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"location" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"about" ILIKE ?`, [`%${query}%`])
          .orWhereRaw(`"role" ILIKE ?`, [`%${query}%`])
          .where({status: 'approved'})
          .paginate({ perPage: config.profilePagination.perPage, currentPage });

      response.status(200).json({RqUid, entries}).end();
    });

export { router as ProfileController};
