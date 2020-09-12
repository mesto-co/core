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

/**
 * @typedef {Object} TestEntry
 * @property {number} fieldA
 * @property {string} fieldB
 *
 * @returns {Knex.QueryBuilder<TestEntry, {}>}
 */
const TestEntries = () => knex('test_entries');

const entryRouter = express.Router();
entryRouter.route('/')
    .get(async (request, response) => {
      const {id, RqUid} = getArgs(request);
      const entry = await TestEntries().where('id', id).first();
      if (entry)
        response.status(200).json({...entry, RqUid}).end();
      else
        response.status(404).json({RqUid}).end();
    })
    .put(async (request, response) => {
      const {id, RqUid, fieldA, fieldB} = getArgs(request);
      await TestEntries().where('id', id).update({fieldA, fieldB});
      response.status(200).send({RqUid}).end();
    })
    .delete(async (request, response) => {
      const {id, RqUid} = getArgs(request);
      await TestEntries().where('id', id).del();
      response.status(200).send({RqUid}).end();
    });

const router = express.Router();
router.route('/')
    .get(async (request, response) => {
      const {RqUid} = getArgs(request);
      // TODO(ak239spb): how will we do pagination.
      // TODO(ak239spb): nice way to handle database errors.
      response.status(200).json({RqUid, entries: await TestEntries().select()}).end();
    })
    .post(async (request, response, next) => {
      const {RqUid, fieldA, fieldB} = getArgs(request);
      try {
        const [id] = await TestEntries().returning('id').insert({fieldA, fieldB});
        if (id)
          response.status(200).json({id, RqUid}).end();
        else
          response.status(500).json({}).end();
      } catch (e) {
        next(e);
      }
    });

export { entryRouter as TestEntryController, router as TestController };
