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

/**
 * @typedef {Object} CityTable
 * @property {object} userInput
 * @property {string} location
 *
 * @returns {Knex.QueryBuilder<CityTable, {}>}
 */
const router = express.Router();

router.route('/')
    .post(async (request, response) => {
      const { RqUid, userInput } = getArgs(request);
      try {
        const location = await knex.select('c.name as cityName','co.name as countryName')
            .from('City AS c')
            .leftJoin('Region AS r', 'r.id', 'c.region_id')
            .leftJoin('Country AS co', 'r.country_id', 'co.id')
            .where('c.name', 'like', `%${userInput}%`)
            .limit(5);
        response.status(200).json({ location: location.map((e: any) => ({city: e.cityName, country: e.countryName})), RqUid }).end();
      } catch (error) {
        response.status(500).json({RqUid}).end();
      }
    });
export { router as LocationsController };
