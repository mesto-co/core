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

const { get, getAuthHeader, getHost } = require('../utils.js');

const authHeader = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('GET /v1/database/getSkills', async () => {
  await check('test_skill', 0, 100, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
  await check('test_skill', 0, 1000, 200, 5, ['test_skilla', 'test_skillab', 'test_skillb', 'test_skillc', 'test_skillмощь']);
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
  await check('a'.repeat(15), 0, 10, 200, 0, []);
  await check('a'.repeat(16), 0, 10, 400, 0, []);

  {
    const url = `${getHost()}/v1/database/getSkills`;
    const {code, data} = await get(url, authHeader);
    expect(code).toBe(200);
    // with empty q - we return all skills
    expect(data.count).toBeGreaterThan(0);
    // default count is 10
    expect(data.items.length).toBe(10);
  }

  // await check('м', 0, 100, 200, 2, []);

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
