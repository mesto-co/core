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
const { post, getHost, getRqUid, getAuthHeader } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/profile/search`;
const RqUid = getRqUid();
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('/v1/search/ POST', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': 'иван','username': 'иван','location': 'иван'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data[0].email).toEqual('iryabinin@gmail.com');
  expect(getSearchData.entries.data[0].status).toEqual('approved');
});

test('/v1/search/ POST two correct words: firstName and lastName', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': 'иван'},{'fullName': 'Рябинин'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data[0].email).toEqual('iryabinin@gmail.com');
  expect(getSearchData.entries.data[0].status).toEqual('approved');
});

test('/v1/search/ POST two words: firstName and wrong lastName', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': 'иван'},{'fullName': 'Рябинович'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST param that does not exists', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'gender': 'девушка'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).not.toEqual([]);
});

test('/v1/search/ POST without perPage and currentPage and with empty query', async () => {
  const testEntry = {RqUid,'query': []};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).not.toEqual([]);
});


test('/v1/search/ POST with wrong page number', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  testEntry.currentPage = 2;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with no existing user', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': '///','username': '///','location': '///'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with sql injection attempt', async () => {
  const testEntry = {RqUid,'perPage': 100,'query': [{'fullName': `иван'+OR+1=1--`,'username': `иван'+OR+1=1--`,'location': `иван'+OR+1=1--`}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with exceed the limit', async () => {
  const testEntry = {RqUid,'perPage': 1001,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.message).toEqual('should be <= 1000');
});

test('/v1/search/ POST with array parameter which exceed the limit:username', async () => {
  const testEntry = {RqUid,'perPage': 20,'query': [{'fullName': '1234567890123456789012345678903333','username': '1234567890123456789012345678903333','location': '1234567890123456789012345678903333'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.message).toEqual('should NOT be longer than 30 characters');
});

test('/v1/search/ POST with array parameter which exceed the limit: fullname', async () => {
  const longName = new Array(257).join('a');
  const testEntry = {RqUid,'perPage': 20,'query': [{'fullName': longName}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.message).toEqual('should NOT be longer than 255 characters');
});

test('/v1/search/ POST without perPage and currentPage and with empty query', async () => {
  const testEntry = {RqUid,'query': 'text'};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.message).toEqual('should be array');
});

test('/v1/search/ POST without query', async () => {
  const testEntry = {RqUid,'perPage': 100};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual(`should have required property 'query'`);
});

test('/v1/search/ POST without RqUid', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual(`should have required property 'RqUid'`);
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
  });

  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}], invalidHeader};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry));
  expect(code).toBe(401);
});


