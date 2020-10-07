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

const {get, post, put, del, getHost} = require('./utils.js');

const ENDPOINT = `${getHost()}/test/success/`;

test('X-Request-Id', async () => {
  const headers = {'X-Request-Id': 'd5ab3356-f4b4-11ea-adc1-0242ac120002'};
  const {code: getCode, headers: getHeaders} = await get(ENDPOINT, headers);
  expect(getCode).toBe(200);
  expect(getHeaders['x-request-id']).toBe(headers['X-Request-Id']);
  const {code: postCode, headers: postHeaders} = await post(ENDPOINT, '', headers);
  expect(postCode).toBe(200);
  expect(postHeaders['x-request-id']).toBe(headers['X-Request-Id']);
  const {code: putCode, headers: putHeaders} = await put(ENDPOINT, '', headers);
  expect(putCode).toBe(200);
  expect(putHeaders['x-request-id']).toBe(headers['X-Request-Id']);
  const {code: delCode, headers: delHeaders} = await del(ENDPOINT, headers);
  expect(delCode).toBe(200);
  expect(delHeaders['x-request-id']).toBe(headers['X-Request-Id']);
});

test('X-Request-Id wrong format', async () => {
  const headers = {'X-Request-Id': '239'};
  const {code: getCode} = await get(ENDPOINT, headers);
  expect(getCode).toBe(400);
  const {code: postCode} = await post(ENDPOINT, '', headers);
  expect(postCode).toBe(400);
  const {code: putCode} = await put(ENDPOINT, '', headers);
  expect(putCode).toBe(400);
  const {code: delCode} = await del(ENDPOINT, headers);
  expect(delCode).toBe(400);
});

test('without X-Request-Id', async () => {
  const {code: getCode} = await get(ENDPOINT, {});
  expect(getCode).toBe(400);
  const {code: postCode} = await post(ENDPOINT, '', {});
  expect(postCode).toBe(400);
  const {code: putCode} = await put(ENDPOINT, '', {});
  expect(putCode).toBe(400);
  const {code: delCode} = await del(ENDPOINT, {});
  expect(delCode).toBe(400);
});

test('compatibility: RqUid instead of X-Request-Id', async () => {
  const RqUid = 'd5ab3356-f4b4-11ea-adc1-0242ac120002';
  const {code: getCode} = await get(ENDPOINT + '?RqUid=' + RqUid, {});
  expect(getCode).toBe(200);
  const {code: postCode} = await post(ENDPOINT, JSON.stringify({RqUid}), {});
  expect(postCode).toBe(200);
  const {code: putCode} = await put(ENDPOINT, JSON.stringify({RqUid}), {});
  expect(putCode).toBe(200);
  const {code: delCode} = await del(ENDPOINT + '?RqUid=' + RqUid, {});
  expect(delCode).toBe(200);
});
