
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

const { post, getHost, getAuthHeader, genUsers } = require('../utils.js');

function toExpected(user) {
  return {
    about: user.about,
    fullName: user.fullName,
    id: user.id,
    imagePath: user.imagePath,
    location: user.location,
    skills: user.skills,
    username: user.username,
    busy: user.busy,
  };
}

describe.only('/v1/searchByEmail', () => {
  let authHeader = null;
  const endpoint = getHost() + '/v1/profile/searchByEmail';
  const postSearch = body => post(endpoint, body, authHeader);
  beforeEach(async () => {
    const [current] = await genUsers(1602998724703, [{}]);
    authHeader = getAuthHeader({id: current.id, permissions: [16]});
  });
  test('/v1/profile/searchByEmail', async () => {
    const [user] = await genUsers(1603000265436, [{ email: 'test@test.ru' }]);
    const result = await postSearch({ email: 'test@test.ru' });
    expect(result)
        .toMatchObject({ code: 200, data: { user: toExpected(user) } });
  });
});
