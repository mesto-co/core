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

import knex from './knex';
import { UserStatus } from './enums/UserStatus';
import {getArgs} from './utils';
const {adminUserId, enableMethodsForTest} = require('../config.js');

interface UserEntryForSearch {
    fullName: string,
    location: string,
    skills: string[],
    about: string
}

const ruToEn = new Map([
  [ 'а', 'a' ],
  [ 'б', 'b' ],
  [ 'в', 'v' ],
  [ 'г', 'g' ],
  [ 'д', 'd' ],
  [ 'е', 'e' ],
  [ 'ё', 'yo' ],
  [ 'ж', 'zh' ],
  [ 'з', 'z' ],
  [ 'и', 'i' ],
  [ 'й', 'j' ],
  [ 'к', 'k' ],
  [ 'л', 'l' ],
  [ 'м', 'm' ],
  [ 'н', 'n' ],
  [ 'о', 'o' ],
  [ 'п', 'p' ],
  [ 'р', 'r' ],
  [ 'с', 's' ],
  [ 'т', 't' ],
  [ 'у', 'u' ],
  [ 'ф', 'f' ],
  [ 'х', 'h' ],
  [ 'ц', 'ts' ],
  [ 'ч', 'ch' ],
  [ 'ш', 'sh' ],
  [ 'щ', 'shch' ],
  [ 'ъ', 'ie' ],
  [ 'ы', 'y' ],
  [ 'ь', '' ],
  [ 'э', 'e' ],
  [ 'ю', 'yu' ],
  [ 'я', 'ya' ],
]);

function toEn(input: string) {
  return input.replace(/[а-яё]/g, m => ruToEn.get(m) || m);
}

const enToRu = new Map([
  [ 'a', 'а' ],
  [ 'b', 'б' ],
  [ 'c', 'ц' ],
  [ 'd', 'д' ],
  [ 'e', 'е' ],
  [ 'f', 'ф' ],
  [ 'g', 'г' ],
  [ 'h', 'х' ],
  [ 'i', 'и' ],
  [ 'j', 'й' ],
  [ 'k', 'к' ],
  [ 'l', 'л' ],
  [ 'm', 'м' ],
  [ 'n', 'н' ],
  [ 'o', 'о' ],
  [ 'p', 'п' ],
  [ 'q', 'q' ],
  [ 'r', 'р' ],
  [ 's', 'с' ],
  [ 't', 'т' ],
  [ 'u', 'у' ],
  [ 'v', 'в' ],
  [ 'w', 'в' ],
  [ 'x', 'кс' ],
  [ 'y', 'ы' ],
  [ 'z', 'з' ]
]);

function toRu(input: string) {
  return input.replace(/[a-z]/g, m => enToRu.get(m) || m);
}

async function invalidateSearchIndex(userId: string) {
  const userData = (await knex('User').select(['fullName', 'location', 'skills', 'about']).where('id', userId))[0];
  if (!userData)
    return;

  const user: UserEntryForSearch = {
    fullName: userData.fullName || '',
    location: userData.location || '',
    skills: userData.skills || [],
    about: userData.about || ''
  };

  const wordsFromFullName = user.fullName.toLowerCase().split(/\s+/).filter(v => v.length > 0 && v.length < 32);
  const wordsFromLocation = user.location.toLowerCase().split(',').map(v => v.trim()).filter(v => v.length > 0 && v.length < 32);
  const wordsFromSkills = user.skills.map(v => v.toLowerCase()).filter(v => v.length > 0 && v.length < 32);
  const wordsFromAbout = user.about.toLowerCase().split(/[^ЁёА-яa-zA-Z]+/).filter(v => v.length > 0 && v.length < 32);

  const generateRuEnSearchWord = (word: string) => {
    const ru = toRu(word).substr(0, 32);
    const en = toEn(word).substr(0, 32);
    return [[ru, ru], [en, ru], [word, ru]];
  };

  const searchWordPairs = [
    ...wordsFromFullName.map(generateRuEnSearchWord),
    ...wordsFromLocation.map(generateRuEnSearchWord),
    ...wordsFromSkills.map(word => [[word, word]]),
    ...wordsFromAbout.map(word => [[word, word]]),
  ].flat();

  // We should sort words to avoid deadlock in INSERT INTO below, the example of bad queries run in parallel:
  // INSERT INTO ... (a, b), (c, d)
  // INSERT INTO ... (c, d), (a, b)
  searchWordPairs.sort((wordsA, wordsB) => {
    for (let i = 0; i < wordsA.length; ++i) {
      if (wordsA[i] < wordsB[i])
        return -1;
      if (wordsA[i] > wordsB[i])
        return 1;
    }
    return 0;
  });

  const searchWords = searchWordPairs.flat();

  // We use raw here due to the lack of ON CONFLICT support in the knex.
  // https://github.com/knex/knex/issues/3186
  for (let i = 0; i < 5; ++i) {
    try {
      await knex.raw(`
        INSERT INTO search_word(word, base)
        VALUES ${Array(searchWords.length / 2).fill('(?,?)').join(',')}
        ON CONFLICT DO NOTHING`, searchWords);
      break;
    } catch (e) {
    }
  }

  await knex.raw(`
    UPDATE search_word sw
    SET base = base_sw.base
    FROM search_word base_sw
    WHERE sw.base = base_sw.word AND base_sw.base IS NOT NULL AND sw.base != base_sw.base`);

  await knex.raw('DELETE FROM search_word_user WHERE user_id = ?', [userId]);

  await knex('search_word_user').insert([
    ...wordsFromFullName.map(word => ({base: word, user_id: userId, weight: 1000})),
    ...wordsFromSkills.map(word => ({base: word, user_id: userId, weight: 500})),
    ...wordsFromLocation.map(word => ({base: word, user_id: userId, weight: 300})),
    ...wordsFromAbout.map(word => ({base: word, user_id: userId, weight: 50})),
  ].flat());

  // We use raw here due to the lack of UPDATE ... FROM support in the knex.
  // https://github.com/knex/knex/issues/1586
  await knex.raw(`
    UPDATE search_word_user swu
    SET base = base_sw.base
    FROM search_word base_sw
    WHERE user_id = ? AND swu.base = base_sw.word AND base_sw.base IS NOT NULL AND swu.base != base_sw.base;`, userId);
}

function sanitizeUser(entry: { [x: string]: any; }) {
  const fields = [ 'rank', 'fullName', 'id', 'username', 'imagePath', 'location', 'about', 'skills', 'isFriend', 'busy', 'placeId'];
  const out: {[key: string]: string;} = {};
  for (const field of fields) {
    const value = entry[field];
    if  (value !== undefined && value !== null)
      out[field] = value;
  }
  return out;
}

async function performSearch(query: string, limit: number, offset: number, userId: string, onlyFriends: boolean) {
  const queries = query ? query.toLowerCase().split(/\s+/) : [];
  // We use raw here due... After previous three comments in this file Aleksei is going to migrate us to raw postgres client.
  const result = await knex.raw(`
    SELECT SUM(swu.weight) as rank, u."fullName", u.id, u.username, u."imagePath", u.location, u.about, u.skills, u.busy, EVERY(f.id IS NOT NULL) as "isFriend", count(*) OVER() AS total
    FROM search_word sw
    INNER JOIN search_word_user swu ON swu.base = sw.base
    INNER JOIN "User" u ON swu.user_id = u.id AND u.status = ?
    ${onlyFriends ? 'INNER' : 'LEFT'} JOIN "Friend" f ON u.id = f."friendId" AND f."userId" = ?
    ${queries.length ? `WHERE ${[...Array(queries.length).fill('sw.word % ?'), 'sw.word like CONCAT(?::text, \'%\')'].join(' OR ')}` : ''}
    GROUP BY u.id
    ORDER BY SUM(swu.weight) DESC, u.id DESC
    LIMIT ?
    OFFSET ?`, queries.length  ? [UserStatus.APPROVED, userId, ...queries, queries[queries.length - 1], limit, offset] : [UserStatus.APPROVED, userId, limit, offset]);
  return {
    data: result.rows.map(sanitizeUser),
    total: result.rows.length > 0 && (result.rows[0].total * 1) || 0
  };
}

const router = express.Router();
router.route('/')
    .get(async (request, response) => {
      const {id: userId} = request.user!;
      if (userId !== adminUserId)
        return response.status(401).json({}).end();
      await Promise.allSettled((await knex('User').select('id')).map((v: {id: string}) => invalidateSearchIndex(v.id)));
      response.status(200).json({}).end();
    });

const invalidateSearchIndexForTestRouter = express.Router();
if (enableMethodsForTest) {
  invalidateSearchIndexForTestRouter.route('/')
      .post(async (request, response) => {
        const {userIds}: {userIds: string[]} = getArgs(request);
        await Promise.allSettled(userIds.map(id => invalidateSearchIndex(id)));
        response.status(200).json({}).end();
      });
}

interface V1SearchArgs {
  q: string;
  placeId: string|undefined;
  skills: string[];
  busy: string|undefined;
  offset: number;
  count: number;
  isFriend: boolean
}

const searchController = express.Router();
searchController.route('/').post(async (request, response) => {
  try {
    const {id: userId} = request.user!;
    const {q, placeId, skills: skillsRaw, busy, offset, count, isFriend}: V1SearchArgs = getArgs(request);
    const skills = skillsRaw.map(skill => skill.toLowerCase());
    const parts = q ? q.toLowerCase().split(/\s+/) : [];
    const partEntries = parts.map((part, index) => ['part' + index, part]);
    const queryClause = [
      ...partEntries.map(([key]) => '(sw.word % :' + key + ')'),
      (partEntries.length ? `(sw.word LIKE CONCAT(:part${partEntries.length - 1}::text, '%'))` : '')
    ].filter(v => v.length > 0).join(' OR ');
    const userWhereClause = ' u.status = :userStatus ' +
      (placeId ? ' AND u.place_id = :placeId' : '') +
      (skills.length ? ' AND u.skills_lo && :skills ' : '') +
      (busy !== undefined ? ' AND u.busy = :busy' : '');
    const result = await knex.raw(`
      SELECT u."fullName", u.id, u.username, u."imagePath", u.location, u.about, u.skills, u.busy, u.place_id as "placeId", EVERY(f.id IS NOT NULL) as "isFriend"
      FROM search_word sw
      INNER JOIN search_word_user swu ON sw.base = swu.base ${queryClause ? 'AND (' + queryClause + ')' : ''}
      INNER JOIN "User" u ON swu.user_id = u.id AND ${userWhereClause}
      ${isFriend ? 'INNER' : 'LEFT'} JOIN "Friend" f ON u.id = f."friendId" AND f."userId" = :userId
      GROUP BY u.id
      ORDER BY sum(swu.weight) DESC, u.id DESC
      OFFSET :offset LIMIT :count`, {
      ...Object.fromEntries(partEntries), userTable: 'User', busy, placeId, skills, offset, count, userStatus: UserStatus.APPROVED, userId
    });
    const total = await knex.raw(`
      SELECT count(distinct u.id) as total
      FROM search_word sw
      INNER JOIN search_word_user swu ON sw.base = swu.base ${queryClause ? 'AND (' + queryClause + ')' : ''}
      INNER JOIN "User" u ON swu.user_id = u.id AND ${userWhereClause}
      ${isFriend ? 'INNER' : 'LEFT'} JOIN "Friend" f ON u.id = f."friendId" AND f."userId" = :userId`, {
      ...Object.fromEntries(partEntries), userTable: 'User', busy, placeId, skills, offset, count, userStatus: UserStatus.APPROVED, userId
    });
    response.status(200).send({
      data: result.rows.map(sanitizeUser),
      total: total.rows.length ? parseInt(total.rows[0].total, 10) : 0
    }).end();
  } catch (e) {
    console.debug('POST /v1/search: ' + e);
    response.status(500).send({}).end();
  }
});

export {
  invalidateSearchIndex,
  performSearch,
  searchController as SearchController,
  router as InvalidateSearchIndexController,
  invalidateSearchIndexForTestRouter as InvalidateSearchIndexForTest
};
