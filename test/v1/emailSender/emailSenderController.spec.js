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
const { post, getHost, getRqUid } = require('../../utils.js');

const GENERATE_TOKEN_ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const SEND_MAGIC_LINK_ENDPOINT = `${getHost()}/v1/email/sendMagicLink`;
const RqUid = getRqUid();

test('/v1/email/sendMagicLink/', async () => {
  const email = 'iryabinin@gmail.com';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({RqUid, email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email, tokenId}));
  expect(code).toBe(200);
  expect(data.RqUid).toEqual(RqUid);
});

test('/v1/email/sendMagicLink/ POST without tokenId', async () => {
  const email = 'iryabinin@gmail.com';
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST incorrect format tokenId', async () => {
  const email = 'iryabinin@gmail.com';
  const tokenId = 'incorrect token';
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email, tokenId}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST without email', async () => {
  const email = 'iryabinin@gmail.com';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({RqUid, email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, tokenId}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST incorrect format email', async () => {
  const email = 'iryabinin@gmail.com';
  const incorrectEmail = 'incorrect format';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({RqUid, email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email: incorrectEmail, tokenId}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST without RqUid', async () => {
  const email = 'iryabinin@gmail.com';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({RqUid, email}));
  const {data, code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/email/sendMagicLink/ POST non-existed token', async () => {
  const email = 'iryabinin@gmail.com';
  const nonExistedToken = '00000000-0000-0000-0000-000000000000';
  const {code} = await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email, tokenId: nonExistedToken}));
  expect(code).toBe(404);
});
