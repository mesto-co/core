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

const { post, getHost, genUsers } = require('../../utils.js');

const GENERATE_TOKEN_ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const SEND_MAGIC_LINK_ENDPOINT = `${getHost()}/v1/email/sendMagicLink`;

let email = null;
beforeEach(async () => {
  const users = await genUsers(7, [{}]);
  email = users[0].email;
});

test('/v1/email/sendMagicLink/', async () => {
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  const {code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId}));
  expect(code).toBe(200);
});

test('/v1/email/sendMagicLink/ POST without tokenId', async () => {
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST incorrect format tokenId', async () => {
  const tokenId = 'incorrect token';
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST without email', async () => {
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({tokenId}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST incorrect format email', async () => {
  const incorrectEmail = 'incorrect format';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email: incorrectEmail, tokenId}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST non-existed token', async () => {
  const nonExistedToken = '00000000-0000-0000-0000-000000000000';
  const {code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId: nonExistedToken}));
  expect(code).toBe(404);
});
