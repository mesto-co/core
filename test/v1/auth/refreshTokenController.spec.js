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

const ENDPOINT = `${getHost()}/v1/auth/refresh`;
const RqUid = getRqUid();
const fs = require('fs').promises;
const url = require('url');

const GENERATE_TOKEN_ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const SEND_MAGIC_LINK_ENDPOINT = `${getHost()}/v1/email/sendMagicLink`;
const {
  emailService: {
    saveFilePath
  }
} = require('../../../config.js');

test('/v1/auth/refresh', async () => {
  const email = 'iryabinin@gmail.com';
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({RqUid, email}));
  await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({RqUid, email, tokenId}));

  const magicLink = await fs.readFile(saveFilePath, 'utf8');
  const magicLinkToken = new URLSearchParams(url.parse(magicLink).query).get('token');
  const {data: getTokenByMagicLinkData, code: getTokenByMagicLinkCode} = await post(ENDPOINT, JSON.stringify({RqUid, refreshToken: magicLinkToken}));

  expect(getTokenByMagicLinkCode).toBe(200);
  expect(getTokenByMagicLinkData.RqUid).toEqual(RqUid);
  expect(getTokenByMagicLinkData.refreshToken).toBeDefined();
  expect(getTokenByMagicLinkData.accessToken).toBeDefined();

  const {data: getTokenByRefreshData, code: getTokenByRefreshCode} = await post(ENDPOINT, JSON.stringify({RqUid, refreshToken: getTokenByMagicLinkData.refreshToken}));

  expect(getTokenByRefreshCode).toBe(200);
  expect(getTokenByRefreshData.RqUid).toEqual(RqUid);
  expect(getTokenByRefreshData.refreshToken).toBeDefined();
  expect(getTokenByRefreshData.accessToken).toBeDefined();

  const {data: getTokenByUsedMagicLinkTokenData, code: getTokenByUsedMagicLinkTokenCode} = await post(ENDPOINT, JSON.stringify({RqUid, refreshToken: magicLinkToken}));

  expect(getTokenByUsedMagicLinkTokenCode).toBe(401);
  expect(getTokenByUsedMagicLinkTokenData.RqUid).toEqual(RqUid);
  expect(getTokenByUsedMagicLinkTokenData.refreshToken).toBeUndefined();
  expect(getTokenByUsedMagicLinkTokenData.accessToken).toBeUndefined();

  const {data: getTokenByUsedRefreshTokenData, code: getTokenByUsedRefreshTokenCode} = await post(ENDPOINT, JSON.stringify({RqUid, refreshToken: getTokenByMagicLinkData.refreshToken}));

  expect(getTokenByUsedRefreshTokenCode).toBe(401);
  expect(getTokenByUsedRefreshTokenData.RqUid).toEqual(RqUid);
  expect(getTokenByUsedRefreshTokenData.refreshToken).toBeUndefined();
  expect(getTokenByUsedRefreshTokenData.accessToken).toBeUndefined();
});

test('/v1/auth/refresh without refresh token', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({RqUid}));

  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
  expect(data.message).toBeDefined();
});

test('/v1/auth/refresh without RqUid', async () => {
  const refreshToken = 'refreshToken';

  const {data, code} = await post(ENDPOINT, JSON.stringify({refreshToken}));

  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});
