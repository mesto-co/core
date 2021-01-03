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

test('/v1/admin/addUser', async () => {
  const [rootUser] = await genUsers(1609658785224, [{}]);
  const authHeaderWithoutPermission = getAuthHeader({user: rootUser, permissions: []});
  const email = 'a' + Date.now() + '@gmail.com';
  expect(await post(getHost() + '/v1/admin/addUser', {email, fullName: 'A B'}, authHeaderWithoutPermission))
      .toMatchObject({ code: 401 });
  const authHeader = getAuthHeader({user: rootUser, permissions: [4]});
  expect(await post(getHost() + '/v1/admin/addUser', {email, fullName: 'A B'}, authHeader))
      .toMatchObject({ code: 200 });
});

test('/v1/admin/activateUser', async () => {
  const [rootUser] = await genUsers(1609658785224, [{}]);
  const authHeaderWithoutPermission = getAuthHeader({user: rootUser, permissions: []});
  expect(await post(getHost() + '/v1/admin/activateUser', {email: rootUser.email}, authHeaderWithoutPermission))
      .toMatchObject({ code: 401 });
  const authHeader = getAuthHeader({user: rootUser, permissions: [2]});
  expect(await post(getHost() + '/v1/admin/activateUser', {email: rootUser.email}, authHeader))
      .toMatchObject({ code: 200 });
});

test('/v1/admin/banUser', async () => {
  const [rootUser] = await genUsers(1609658785224, [{}]);
  const authHeaderWithoutPermission = getAuthHeader({user: rootUser, permissions: []});
  expect(await post(getHost() + '/v1/admin/banUser', {email: rootUser.email}, authHeaderWithoutPermission))
      .toMatchObject({ code: 401 });
  const authHeader = getAuthHeader({user: rootUser, permissions: [3]});
  expect(await post(getHost() + '/v1/admin/banUser', {email: rootUser.email}, authHeader))
      .toMatchObject({ code: 200 });
});

test('/v1/admin/existUsers', async () => {
  const [rootUser] = await genUsers(1609658785224, [{}]);
  const authHeaderWithoutPermission = getAuthHeader({user: rootUser, permissions: []});
  expect(await post(getHost() + '/v1/admin/existUsers', {emails: [rootUser.email]}, authHeaderWithoutPermission))
      .toMatchObject({ code: 401 });
  const authHeader = getAuthHeader({user: rootUser, permissions: [6]});
  expect(await post(getHost() + '/v1/admin/existUsers', {emails: [rootUser.email, Date.now() + 'abc@gmail.com']}, authHeader))
      .toMatchObject({ code: 200, data: {emails: [rootUser.email]}});
});
