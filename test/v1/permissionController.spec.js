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

const { getAuthHeader, getHost, genUsers, post } = require('../utils.js');

describe('/v1/permission', () => {
  test('/v1/addDelPermission with proper auth', async () => {
    const [rootUser, aUser] = await genUsers(1609178164580, [{}, {}]);
    const authHeader = getAuthHeader({
      user: rootUser,
      permissions: [1]
    });
    expect(await post(getHost() + '/v1/addPermission', {user_id: aUser.id, permission_id: 1}, authHeader))
        .toMatchObject({ code: 200 });
    expect(await post(getHost() + '/v1/delPermission', {user_id: aUser.id, permission_id: 1}, authHeader))
        .toMatchObject({ code: 200 });
  });
  test('/v1/addDelPermission without proper auth', async () => {
    const [rootUser, aUser] = await genUsers(1609178164580, [{}, {}]);
    const authHeader = getAuthHeader({
      user: rootUser
    });
    expect(await post(getHost() + '/v1/addPermission', {user_id: aUser.id, permission_id: 1}, authHeader))
        .toMatchObject({ code: 401 });
    expect(await post(getHost() + '/v1/delPermission', {user_id: aUser.id, permission_id: 1}, authHeader))
        .toMatchObject({ code: 401 });
  });
});
