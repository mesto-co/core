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
const { post, getHost, getAuthHeader } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/profile/search`;
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('/v1/search/ POST', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'иван','username': 'иван','location': 'иван'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].username).toEqual('iryabinin');
  expect(getSearchData.entries.data[0].status).toEqual('approved');
});

test('/v1/search/ POST two correct words: firstName and lastName', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'иван'},{'fullName': 'Рябинин'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].username).toEqual('iryabinin');
  expect(getSearchData.entries.data[0].fullName).toEqual('Иван Рябинин');
  expect(getSearchData.entries.data[0].imagePath).toEqual('https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000');
  expect(getSearchData.entries.data[0].id).toEqual('00000000-1111-2222-3333-000000000001');
  expect(getSearchData.entries.data[0].status).toEqual('approved');
});

test('/v1/search/ POST two words: firstName and wrong lastName', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'иван'},{'fullName': 'Рябинович'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST param that does not exists', async () => {
  const testEntry = {'perPage': 100,'query': [{'gender': 'девушка'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).not.toEqual([]);
});

test('/v1/search/ POST without perPage and currentPage and with empty query', async () => {
  const testEntry = {'query': []};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).not.toEqual([]);
});


test('/v1/search/ POST with wrong page number', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  testEntry.currentPage = 2;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with no existing user', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': '///','username': '///','location': '///'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with sql injection attempt', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': `иван'+OR+1=1--`,'username': `иван'+OR+1=1--`,'location': `иван'+OR+1=1--`}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with skills', async () => {
  const testEntry = {'perPage': 100,'query': [{'skill': 'Offic'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry),header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].skills[0]).toEqual('Improvements');
});

test('/v1/search/ POST with exceed the limit', async () => {
  const testEntry = {'perPage': 1001,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual('should be <= 1000');
});

test('/v1/search/ POST with array parameter which exceed the limit:username', async () => {
  const testEntry = {'perPage': 20,'query': [{'fullName': '1234567890123456789012345678903333','username': '1234567890123456789012345678903333','location': '1234567890123456789012345678903333'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual('should NOT be longer than 30 characters');
});

test('/v1/search/ POST with array parameter which exceed the limit: fullname', async () => {
  const longName = new Array(257).join('a');
  const testEntry = {'perPage': 20,'query': [{'fullName': longName}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual('should NOT be longer than 255 characters');
});

test('/v1/search/ POST without perPage and currentPage and with empty query', async () => {
  const testEntry = {'query': 'text'};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual('should be array');
});

test('/v1/search/ POST without query', async () => {
  const testEntry = {'perPage': 100};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual(`should have required property 'query'`);
});

test('/v1/search/ POST without access token', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry));
  expect(code).toBe(401);
});

test('/v1/search/ POST with access token algorithm none', async () => {
  const invalidHeader = getAuthHeader({
    id: '00000000-1111-2222-3333-000000000001',
    fullName: 'Иван Рябинин',
  }, 'none');

  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry), invalidHeader);
  expect(code).toBe(401);
});

test('/v1/search/ POST emtpy string is 400', async () => {
  await check([{fullName: ''}]);
  await check([{username: ''}]);
  await check([{location: ''}]);
  await check([{about: ''}]);
  await check([{role: ''}]);
  await check([{skills: ''}]);

  async function check(query) {
    const {code} = await post(ENDPOINT, JSON.stringify({query: query}), header);
    expect(code).toBe(400);
  }
});
