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
const { get } = require('../../utils.js');

const IS_CI = !!process.env.CI;
const ENDPOINT = `http://${IS_CI ? 'core' : 'localhost'}:8080/v1/profile/search`;
const RqUid = 'd5ab3356-f4b4-11ea-adc1-0242ac120002';

test('/v1/search/ GET', async () => {
  const testEntry = {
    query: 'iryabinin',
    currentPage: 0,
  };

  const {data: getSearchData, code: searchCode} = await get(ENDPOINT + `?RqUid=${RqUid}&query=${testEntry.query}`);
  expect(searchCode).toBe(200);
  expect(getSearchData.RqUid).toEqual(RqUid);
  expect(getSearchData.entries.data[0].email).toEqual('iryabinin@gmail.com');
  expect(getSearchData.entries.data[0].status).toEqual('approved');
});

test('/v1/search/ GET with wrong page number', async () => {
  const testEntry = {
    query: 'iryabinin',
    currentPage: 0,
  };
  testEntry.currentPage = 2;
  const {data: getEmtpySearchData, code: searchEmptyCode} = await get(ENDPOINT + `?RqUid=${RqUid}&query=${testEntry.query}&currentPage=${testEntry.currentPage}`);
  expect(searchEmptyCode).toBe(200);
  expect(getEmtpySearchData.RqUid).toEqual(RqUid);
  expect(getEmtpySearchData.entries.data).toEqual([]);
});

test('/v1/search/ GET with no existing user', async () => {
  const testEntry = {
    query: '////',
    currentPage: 0,
  };
  const {data: getEmtpySearchData, code: searchEmptyCode} = await get(ENDPOINT + `?RqUid=${RqUid}&query=${testEntry.query}&currentPage=${testEntry.currentPage}`);
  expect(searchEmptyCode).toBe(200);
  expect(getEmtpySearchData.RqUid).toEqual(RqUid);
  expect(getEmtpySearchData.entries.data).toEqual([]);
});

test('/v1/search/ GET with sql injection attempt', async () => {
  const {data: getEmtpySearchData, code: searchEmptyCode} = await get(ENDPOINT + `?RqUid=${RqUid}&query=иван'+OR+1=1--`);
  expect(searchEmptyCode).toBe(200);
  expect(getEmtpySearchData.RqUid).toEqual(RqUid);
  expect(getEmtpySearchData.entries.data).toEqual([]);
});

test('/v1/search/ GET without query', async () => {
  const {data: getSearchData, code: searchCode} = await get(ENDPOINT + `?RqUid=${RqUid}`);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual(`should have required property 'query'`);
});

test('/v1/search/ GET without RqUid', async () => {
  const {data: getSearchData, code: searchCode} = await get(ENDPOINT + `?&query=test`);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual(`should have required property 'RqUid'`);
});


