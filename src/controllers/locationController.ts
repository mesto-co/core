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

import https from 'https';
import express from 'express';
import knex from '../knex';

import { getArgs } from '../utils';
const {googleMapsApiKey} = require('../../config.js');

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
      const {userInput, sessionToken} = getArgs(request);
      if (sessionToken) {
        const mapsEndpoint = (userInput: string, sessionToken: string, key: string) => 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=' + encodeURIComponent(userInput) + '&sessiontoken=' + sessionToken + '&key=' + key + '&language=ru&types=(regions)';
        const { userInput, sessionToken } = getArgs(request);
        try {
          const result: any = await new Promise((resolve, reject) => https.get(mapsEndpoint(userInput, sessionToken, googleMapsApiKey), response => {
            const chunks: Buffer[] = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
              try {
                const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                resolve(result);
              } catch (e) {
                reject(e);
              }
            });
          }));
          const location = result.predictions.map((prediction: {description: string, place_id: string}) => ({
            description: prediction.description,
            placeId: prediction.place_id
          }));
          response.status(200).json({location}).end();
        } catch (error) {
          console.debug('POST /v1/location', error);
          response.status(500).json({}).end();
        }
      } else {
        // TODO(ak239spb): drop this code as soon as frontend provides sessionToken for each request
        try {
          const location = await knex.select('c.name as cityName','co.name as countryName')
              .from('City AS c')
              .leftJoin('Region AS r', 'r.id', 'c.region_id')
              .leftJoin('Country AS co', 'r.country_id', 'co.id')
              .where('c.name', 'like', `%${userInput}%`)
              .limit(5);
          response.status(200).json({ location: location.map((e: any) => ({city: e.cityName, country: e.countryName})) }).end();
        } catch (error) {
          console.debug('POST /v1/location', error);
          response.status(500).json({}).end();
        }
      }
    });

interface GeocodeResult {
  address_components: {types: string[], short_name: string}[];
  place_id: string;
}

function countryId(result: GeocodeResult) {
  const country = result.address_components.find(component => component.types.includes('country'));
  return country ? country.short_name : '';
}

function resolvedPlaceId(result: GeocodeResult) {
  if (result.address_components.length !== 1)
    return countryId(result) + '|' + result.place_id + '|';
  if (result.address_components[0].types.includes('country'))
    return countryId(result) + '|';
  return '|' + result.place_id + '|';
}

const placeIdResolver = express.Router();
placeIdResolver.route('/').post(async (request, response) => {
  const {placeId} = getArgs(request);
  if (!placeId || placeId.endsWith('|'))
    return response.status(200).json({placeId});
  try {
    const result: {results: GeocodeResult[]} = await new Promise((resolve, reject) => https.get('https://maps.googleapis.com/maps/api/geocode/json?place_id=' + placeId + '&key=' + googleMapsApiKey + '&language=ru', response => {
      const chunks: Buffer[] = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }));
    const [resultObj] = result.results;
    if (resultObj)
      return response.status(200).json({placeId: resolvedPlaceId(resultObj)});
    else
      return response.status(404).json({}).end();
  } catch (error) {
    console.debug('POST /v1/resolvePlaceId', error);
    response.status(500).json({}).end();
  }
});

export { placeIdResolver as PlaceIdResolverController, router as LocationsController };
