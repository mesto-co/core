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

const ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const RqUid = getRqUid();

test('/v1/auth/magicLink', async () => {
  const email = 'iryabinin@gmail.com';
  const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid, email}));
  expect(code).toBe(200);
  expect(data.RqUid).toEqual(RqUid);
});

test('/v1/auth/magicLink POST without email', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/auth/magicLink POST incorrect format email', async () => {
  const email = 'incorrect format';
  const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid, email}));
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/auth/magicLink POST without RqUid', async () => {
  const email = 'iryabinin@gmail.com';
  const {data, code} = await post(ENDPOINT, JSON.stringify({email}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/auth/magicLink POST non-existent email', async () => {
  const email = 'non.existent@gmail.com';
  const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid, email}));
  expect(code).toBe(404);
  expect(data.RqUid).toEqual(RqUid);
});

test('/v1/auth/magicLink POST non-approved users', async () => {
  const emails = [
    'awaiting@gmail.com',
    'closed@gmail.com',
    'rejected@gmail.com'
  ];

  await Promise.all(emails.map(async email => {
    const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid, email}));
    expect(code).toBe(404);
    expect(data.RqUid).toEqual(RqUid);
  }));
});