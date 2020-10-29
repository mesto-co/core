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

const { get, getAuthHeader, getHost, genUsers } = require('../utils.js');

const authHeader = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('GET /v1/database/getSkills', async () => {
  await genUsers(2, [{
    skills: ['test_skillA', 'test_skillB', 'test_skillC', 'test_skillAb', 'test_skillМощь']
  }, {
    skills: ['a', 'b', 'c', 'd', 'e', 'f'] // ensure at least 11 unique skills in the database
  }]);
  await check('test_skill', 0, 100, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
  await check('TeSt_SkIlL', 0, 100, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
  await check('test_skill', 0, 1000, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
  await check('est_skill', 0, 1000, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
  await check('test_skill', 0, 1, 200, 5, ['test_skilla']);
  await check('test_skill', 1, 1, 200, 5, ['test_skillab']);
  await check('test_skill', 2, 1, 200, 5, ['test_skillb']);
  await check('test_skilla', 0, 3, 200, 2, ['test_skilla', 'test_skillab']);
  await check('test_skill', 100000, 10, 200, 5, []);
  await check('test_skill', -100, 10, 400, 0, []);
  await check('test_skill', 5.5, 10, 400, 0, []);
  await check('test_skill', 0, -10, 400, 0, []);
  await check('test_skill', 0, 5.5, 400, 0, []);
  await check('test_skill', 0, 1001, 400, 0, []);
  await check('a'.repeat(32), 0, 10, 200, 0, []);
  await check('a'.repeat(33), 0, 10, 400, 0, []);

  {
    const url = `${getHost()}/v1/database/getSkills`;
    const {code, data} = await get(url, authHeader);
    expect(code).toBe(200);
    // with empty q - we return all skills
    expect(data.count).toBeGreaterThan(0);
    // default count is 10
    expect(data.items.length).toBe(10);
  }

  async function check(q, offset, count, expectedCode, expectedCount, expectedItems) {
    const fields = [];
    if (q !== undefined)
      fields.push('q=' + encodeURIComponent(q));
    if (offset !== undefined)
      fields.push('offset=' + encodeURIComponent(offset + ''));
    if (count !== undefined)
      fields.push('count=' + encodeURIComponent(count + ''));
    const url = `${getHost()}/v1/database/getSkills?${fields.join('&')}`;
    const {code, data} = await get(url, authHeader);
    expect(code).toEqual(expectedCode);
    if (code === 200) {
      expect(data.count).toEqual(expectedCount);
      expect(data.items.sort()).toStrictEqual(expectedItems.sort());
    }
  }
});

test('GET /v1/database/getLocations', async () => {
  const locations = [{
    location: 'Петербург',
    place_id: 'peterburg_id'
  }, {
    location: 'Санкт-Петербург',
    place_id: 'peterburg_id'
  }, {
    location: 'Москва',
    place_id: 'moskva_id'
  }, {
    location: 'Киев',
    place_id: 'kiev_id'
  }, {
    location: 'Сидней',
    place_id: 'sydney_id'
  }, {
    location: 'Кишинев',
    place_id: 'kishinive_id'
  }, {
    location: 'Кировоград',
    place_id: 'kirovograd_id'
  }, {
    location: 'Торонто',
    place_id: 'toronto_id'
  }, {
    location: 'Сан Франциско',
    place_id: 'san_francisco_id'
  }, {
    location: 'Казань',
    place_id: 'kazan_id'
  }, {
    location: 'Петербург',
    place_id: 'florida_peterburg_id'
  }, {
    location: 'Казань',
    place_id: 'kazan_id'
  }];
  await genUsers(3, locations);

  // if we have two cities with different placeId - we return both.
  await check('Петер', 5, 200, [{
    location: 'Петербург',
    placeId: 'peterburg_id'
  }, {
    location: 'Петербург',
    placeId: 'florida_peterburg_id'
  }]);

  await check('пеТер', 5, 200, [{
    location: 'Петербург',
    placeId: 'peterburg_id'
  }, {
    location: 'Петербург',
    placeId: 'florida_peterburg_id'
  }]);

  // if we have two cities with the same location and placeId - we return one result.
  await check('Казань', 5, 200, [{
    location: 'Казань',
    placeId: 'kazan_id'
  }]);

  await check('Ки', 5, 200, [{
    location: 'Киев',
    placeId: 'kiev_id'
  },{
    location: 'Кишинев',
    placeId: 'kishinive_id'
  },{
    location: 'Кировоград',
    placeId: 'kirovograd_id'
  }]);

  await check('a'.repeat(15), 1, 200, []);
  await check('a'.repeat(16), 1, 400, []);
  await check('a'.repeat(15), 1000, 200, []);
  await check('a', 1001, 400, []);
  await check('a', -2, 400, []);
  await check('a', 0, 400, []);
  await check('a', 2.5, 400, []);
  await check('a', 'abc', 400, []);

  {
    const url = `${getHost()}/v1/database/getLocations`;
    const {code, data} = await get(url, authHeader);
    expect(code).toBe(200);
    // default count is 10
    expect(data.items.length).toBe(10);
  }

  {
    const url = `${getHost()}/v1/database/getLocations?count=5`;
    const {code, data} = await get(url, authHeader);
    expect(code).toBe(200);
    expect(data.items.length).toBe(5);
  }

  async function check(q, count, expectedCode, expectedItems) {
    const fields = [];
    if (q !== undefined)
      fields.push('q=' + encodeURIComponent(q));
    if (count !== undefined)
      fields.push('count=' + encodeURIComponent(count + ''));
    const url = `${getHost()}/v1/database/getLocations?${fields.join('&')}`;
    const {code, data} = await get(url, authHeader);
    expect(code).toEqual(expectedCode);
    if (code === 200) {
      const order = (a,b) => (a.location + ':' + a.placeId).localeCompare(b.location + ':' + b.placeId);
      expect(data.items.sort(order)).toStrictEqual(expectedItems.sort(order));
    }
  }
});
