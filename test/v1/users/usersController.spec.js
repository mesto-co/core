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

const { get, del, post, getHost, getAuthHeader, genUsers } = require('../../utils.js');

const USER_ENDPOINT = `${getHost()}/v1/user`;
const USERS_ENDPOINT = `${getHost()}/v1/users/`;
const FRIEND_ENDPOINT = `${getHost()}/v1/user/friend`;

let header = null;
let userId = null;
let userData = null;
beforeEach(async () => {
  const [user] = await genUsers(11, [{busy: true}]);
  userData = user;
  header = getAuthHeader({id: user.id, fullName: userData.fullName});
  userId = user.id;
});

test('GET /v1/users/:id', async () => {
  const {data, code} = await get(USERS_ENDPOINT + userId, header);
  expect(code).toBe(200);
  const user = data.user;
  expect(user.id).toEqual(userId);
  expect(user.fullName).toEqual(userData.fullName);
  expect(user.email).toBeUndefined();
  expect(user.isFriend).toBeFalsy();
  expect(user.skills).toEqual(userData.skills);
  expect(user.status).toEqual('approved');
  expect(user.busy).toEqual(true);
});

test('GET /v1/users/:id has friend', async () => {
  const [{id: friendId}] = await genUsers(12, [{}]);
  await del(`${FRIEND_ENDPOINT}/${friendId}`, header);
  await post(`${FRIEND_ENDPOINT}/${friendId}`, '', header);

  const {data, code} = await get(USERS_ENDPOINT + friendId, header);
  expect(code).toBe(200);
  const user = data.user;
  expect(user.isFriend).toBeTruthy();
});

test('GET /v1/user', async () => {
  const expectedContacts = [{'title': 'telegram', 'url': 'http://t.me/iryabinin'}, {'title': 'linkedin', 'url': 'https://www.linkedin.com/in/iryabinin'}];
  for (const contact of expectedContacts)
    await post(`${getHost()}/v1/contact/`, JSON.stringify(contact), header);

  const {data, code} = await get(USER_ENDPOINT, header);
  expect(code).toBe(200);
  const user = data.user;
  expect(user.id).toEqual(userId);
  expect(user.email).toEqual(userData.email);
  expect(user.fullName).toEqual(userData.fullName);
  expect(user.skills).toEqual(userData.skills);
  expect(user.status).toEqual('approved');
  expect(user.busy).toEqual(true);

  const compareContacts = (a,b) => a.title === b.title ? 0 : a.title > b.title ? 1 : -1;
  user.contacts.sort(compareContacts);
  expectedContacts.sort(compareContacts);
  expect(user.contacts).toEqual(expectedContacts);
});

test('GET /v1/users/:id with invalid id', async () => {
  const {code} = await get(USERS_ENDPOINT + '100', header);
  expect(code).toBe(400);
});

test('GET /v1/users/:id without contact', async () => {
  const {code, data} = await get(USERS_ENDPOINT + userId, header);
  expect(code).toBe(200);
  const user = data.user;
  expect(user.contacts).toEqual([]);
});

test('GET /v1/users/:id with rejected id', async () => {
  const {code} = await get(USERS_ENDPOINT + '00000000-1111-2222-3333-000000000003', header);
  expect(code).toBe(404);
});

test('GET /v1/users/:id with unknown id', async () => {
  const {code} = await get(USERS_ENDPOINT + '99000000-1111-2222-3333-000000000001', header);
  expect(code).toBe(404);
});

test('GET /v1/user busy=false', async () => {
  const [{id}] = await genUsers(13, [{busy: false}]);
  const {data, code} = await get(USERS_ENDPOINT + id, header);
  expect(code).toBe(200);
  expect(data.user.busy).toEqual(false);
});
