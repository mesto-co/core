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
import { getArgs } from '../utils';
import knex from '../knex';

const getSkills = express.Router();
getSkills.route('/')
    .get(async (request, response) => {
      try {
        const {q, offset, count} = getArgs(request);
        const {rows}: {rows: {skill: string, total: string}[]} = await knex.raw(`
          SELECT s.skill as skill FROM 
          (SELECT lower(unnest(skills)) as skill FROM "User") s
          GROUP BY s.skill HAVING s.skill like concat(?::text, '%')
          LIMIT ? OFFSET ?`, [q, count, offset]);
        const {rows: [{count: total}]}: {rows: {count: string}[]} = await knex.raw(`
          SELECT COUNT(DISTINCT skill)
          FROM (SELECT LOWER(unnest(skills)) as skill FROM "User") s
          WHERE skill like concat(?::text, '%')`, [q]);
        response.status(200).send({
          count: parseInt(total, 10),
          items: rows.map(row => row.skill)
        });
      } catch (e) {
        console.debug('/v1/database/getSkills error', e);
        response.status(500).json({}).end();
      }
    });

export {
  getSkills as GetSkillsController
};
