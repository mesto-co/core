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
const { post, getHost, genUsers, getAuthHeader, get } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/auth/refresh`;
const fs = require('fs').promises;
const url = require('url');

const GENERATE_TOKEN_ENDPOINT = `${getHost()}/v1/auth/magicLink`;
const SEND_MAGIC_LINK_ENDPOINT = `${getHost()}/v1/email/sendMagicLink`;
const {
  emailService: {
    saveFilePath
  }
} = require('../../../config.js');

let email = null;
let user = null;
beforeEach(async () => {
  ([user] = await genUsers(1602996153726, [{}]));
  email = user.email;
});

test('/v1/auth/refresh', async () => {
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId}));

  const magicLink = await fs.readFile(saveFilePath, 'utf8');
  const magicLinkToken = new URLSearchParams(url.parse(magicLink).query).get('token');
  const {data: getTokenByMagicLinkData, code: getTokenByMagicLinkCode} = await post(ENDPOINT, JSON.stringify({refreshToken: magicLinkToken}));

  expect(getTokenByMagicLinkCode).toBe(200);
  expect(getTokenByMagicLinkData.refreshToken).toBeDefined();
  expect(getTokenByMagicLinkData.accessToken).toBeDefined();

  const {data: getTokenByRefreshData, code: getTokenByRefreshCode} = await post(ENDPOINT, JSON.stringify({refreshToken: getTokenByMagicLinkData.refreshToken}));

  expect(getTokenByRefreshCode).toBe(200);
  expect(getTokenByRefreshData.refreshToken).toBeDefined();
  expect(getTokenByRefreshData.accessToken).toBeDefined();

  const {data: getTokenByUsedMagicLinkTokenData, code: getTokenByUsedMagicLinkTokenCode} = await post(ENDPOINT, JSON.stringify({refreshToken: magicLinkToken}));

  expect(getTokenByUsedMagicLinkTokenCode).toBe(401);
  expect(getTokenByUsedMagicLinkTokenData.refreshToken).toBeUndefined();
  expect(getTokenByUsedMagicLinkTokenData.accessToken).toBeUndefined();

  const {data: getTokenByUsedRefreshTokenData, code: getTokenByUsedRefreshTokenCode} = await post(ENDPOINT, JSON.stringify({refreshToken: getTokenByMagicLinkData.refreshToken}));

  expect(getTokenByUsedRefreshTokenCode).toBe(401);
  expect(getTokenByUsedRefreshTokenData.refreshToken).toBeUndefined();
  expect(getTokenByUsedRefreshTokenData.accessToken).toBeUndefined();
});

test('/v1/auth/refresh without refresh token', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({}));

  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/auth/refresh permissions e2e test', async () => {
  // prepare user
  const authHeader = getAuthHeader({
    user: user,
    permissions: [1]
  });
  expect(await post(getHost() + '/v1/addPermission', {user_id: user.id, permission_id: 1}, authHeader))
      .toMatchObject({ code: 200 });
  const {data: { tokenId }} = await post(GENERATE_TOKEN_ENDPOINT, JSON.stringify({email}));
  await post(SEND_MAGIC_LINK_ENDPOINT, JSON.stringify({email, tokenId}));

  const magicLink = await fs.readFile(saveFilePath, 'utf8');
  const magicLinkToken = new URLSearchParams(url.parse(magicLink).query).get('token');
  const {data: getTokenByMagicLinkData, code: getTokenByMagicLinkCode} = await post(ENDPOINT, JSON.stringify({refreshToken: magicLinkToken}));

  expect(getTokenByMagicLinkCode).toBe(200);
  expect(getTokenByMagicLinkData.refreshToken).toBeDefined();
  expect(getTokenByMagicLinkData.accessToken).toBeDefined();

  const realAuthHeader = {
    Authorization: `Bearer ${getTokenByMagicLinkData.accessToken}`,
    ['X-Request-Id']: 'd5ab3356-f4b4-11ea-adc1-0242ac120002'
  };
  const [userA] = await genUsers(1609179543003, [{}]);
  expect(await post(getHost() + '/v1/addPermission', {user_id: userA.id, permission_id: 1}, realAuthHeader))
      .toMatchObject({ code: 200 });
  expect(await post(getHost() + '/v1/delPermission', {user_id: userA.id, permission_id: 1}, realAuthHeader))
      .toMatchObject({ code: 200 });
});

test('/v1/user/setPassword', async () => {
  const authHeader = getAuthHeader({
    ...user,
    permissions: [1]
  });
  expect(await post(getHost() + '/v1/user/setPassword', {password: 'abcdef'}, authHeader))
      .toMatchObject({
        code: 200
      });
  const {data: {accessToken, refreshToken}} = await post(getHost() + '/v1/auth/getRefreshTokenByPassword', {
    password: 'abcdef',
    email: user.email.toUpperCase()
  });
  expect(accessToken).not.toBeUndefined();
  expect(refreshToken).not.toBeUndefined();

  // access token is good for access.
  const userExpected = Object.assign({}, user);
  delete userExpected.passwordHash;
  delete userExpected.phone;
  delete userExpected.place_id;
  delete userExpected.skills_lo;
  expect(await get(getHost() + '/v1/user', {
    Authorization: `Bearer ${accessToken}`,
    ['X-Request-Id']: 'd5ab3356-f4b4-11ea-adc1-0242ac120002'
  })).toMatchObject({
    code: 200,
    data: {
      user: userExpected
    }
  });
  // refresh tokens are good for refresh.
  const {data: {accessToken: accessTokenAfterRefresh, refreshToken: refreshTokenAfterRefresh}} = await post(getHost() + '/v1/auth/refresh', {
    refreshToken
  });
  expect(accessTokenAfterRefresh).not.toBeUndefined();
  expect(refreshTokenAfterRefresh).not.toBeUndefined();
});
