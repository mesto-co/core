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
import { query, validationResult } from 'express-validator';
import knex from '../knex';

const test = express.Router();

test.use(express.json());

/**
 * @typedef {Object} TestEntry
 * @property {number} fieldA
 * @property {string} fieldB
 *
 * @returns {Knex.QueryBuilder<TestEntry, {}>}
 */
const TestEntries = () => knex('test_entries');

const FieldAValidator = query('fieldA').isInt();
const FieldBValidator = query('fieldB').isString();

test.route('/testEntry')
    .get(...[FieldAValidator], async function(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
      const [entry] = await TestEntries().where('fieldA', req.query.fieldA);
      if (!entry)
        return res.status(404).json({ errors: ['Entry not found']});
    })
    .post(...[FieldAValidator, FieldBValidator], async function(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
      await TestEntries().insert({
        fieldA: req.query.fieldA,
        fieldB: req.query.fieldB
      });
      res.send('Add a book');
    })
    .put(...[FieldAValidator, FieldBValidator], async function(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
      await TestEntries().where({ email: req.query.fieldA }).update({ password: req.query.fieldB });
    })
    .delete(...[FieldAValidator], async function(req, res) {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
      await TestEntries().where({ fieldA: req.query.fieldA }).del();
    });

export default test;
