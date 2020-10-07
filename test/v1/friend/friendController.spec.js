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
const { post, del, getHost, getAuthHeader } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/user/friend`;
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('/v1/user/friend/ POST', async () => {
  const friendId = '00000000-1111-2222-3333-000000000005';

  await del(`${ENDPOINT}/${friendId}`, header);

  const {code: addCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);
  expect(addCode).toBe(201);

  const {code: repeatAddCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);
  expect(repeatAddCode).toBe(209);
});

test('/v1/user/friend/ POST friend is not approved', async () => {
  const friendIds = [
    '00000000-1111-2222-3333-000000000004', // Status: awaiting
    '00000000-1111-2222-3333-000000000002', // Status: closed
    '00000000-1111-2222-3333-000000000003' // Status: rejected
  ];

  await Promise.all(friendIds.map(async friendId => {
    const {code: addCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);
    expect(addCode).toBe(404);
  }));
});

test('/v1/user/friend/ POST friendId is not real', async () => {
  const friendId = '66666666-1111-2222-3333-000000000009';

  const {code: addCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);
  expect(addCode).toBe(404);
});

test('/v1/user/friend/ POST friend is not uuid', async () => {
  const friendId = '1';

  const {data: addData, code: addCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);
  expect(addCode).toBe(400);
  expect(addData.message).toBeDefined();
});

test('/v1/user/friend/ POST without accessToken', async () => {
  const friendId = '00000000-1111-2222-3333-000000000005';

  const {code: addCode} = await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}));
  expect(addCode).toBe(401);
});


test('/v1/user/friend/ DELETE', async () => {
  const friendId = '00000000-1111-2222-3333-000000000005';

  await post(`${ENDPOINT}/${friendId}`, JSON.stringify({}), header);

  const {code: deleteCode} = await del(`${ENDPOINT}/${friendId}`, header);
  expect(deleteCode).toBe(200);

  const {code: repeatDeleteCode} = await del(`${ENDPOINT}/${friendId}`, header);
  expect(repeatDeleteCode).toBe(209);
});

test('/v1/user/friend/ DELETE friend is not uuid', async () => {
  const friendId = '1';

  const {data: deleteData, code: deleteCode} = await del(`${ENDPOINT}/${friendId}`, header);
  expect(deleteCode).toBe(400);
  expect(deleteData.message).toBeDefined();
});

test('/v1/user/friend/ DELETE without accessToken', async () => {
  const friendId = '00000000-1111-2222-3333-000000000005';

  const {code: deleteCode} = await del(`${ENDPOINT}/${friendId}`);
  expect(deleteCode).toBe(401);
});
