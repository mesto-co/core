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

const ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const GENERATE_TOKEN_ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const SEND_MAGIC_LINK_ENDPOINT = `${getHost()}/v1/email/sendMagicLink`;

let [email, awaitingEmail, closedEmail, rejectedEmail] = [null, null, null, null];

beforeEach(async () => {
  const users = await genUsers(4, [{
  },{
    status: 'awaiting'
  },{
    status: 'closed'
  },{
    status: 'rejected'
  }]);
  ([email, awaitingEmail, closedEmail, rejectedEmail] = users.map(user => user.email));
});

test('/v1/auth/magicLink', async () => {
  const {code} = await post(ENDPOINT, JSON.stringify({email}));
  expect(code).toBe(200);
});

test('/v1/auth/magicLink case insensitive', async () => {
  const {code} = await post(ENDPOINT, JSON.stringify({email: email.toUpperCase()}));
  expect(code).toBe(200);
});

test('/v1/auth/magicLink POST without email', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/auth/magicLink POST incorrect format email', async () => {
  const email = 'incorrect format';
  const {data, code} = await post(ENDPOINT, JSON.stringify({email}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/auth/magicLink POST non-existent email', async () => {
  const email = 'non.existent@gmail.com';
  const {code} = await post(ENDPOINT, JSON.stringify({email}));
  expect(code).toBe(404);
});

test('/v1/auth/magicLink POST non-approved users', async () => {
  const emails = [awaitingEmail, closedEmail, rejectedEmail];

  await Promise.all(emails.map(async email => {
    const {code} = await post(ENDPOINT, JSON.stringify({email}));
    expect(code).toBe(404);
  }));
});

test('/v1/auth/magicLink throttling', async () => {
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  expect(await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId})))
      .toMatchObject({ code: 200 });
  expect(await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId})))
      .toMatchObject({ code: 429 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  expect(await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId})))
      .toMatchObject({ code: 200 });
});
