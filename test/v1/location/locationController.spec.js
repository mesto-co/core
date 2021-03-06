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
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});
const ENDPOINT = `${getHost()}/v1/location/`;

test('/v1/location', async () => {
  const userInput = 'Киев';
  const {data, code} = await post(ENDPOINT, JSON.stringify({userInput}), header);
  expect(code).toBe(200);
  expect(data.location[0].city).toEqual('Киев');
  expect(data.location[0].country).toEqual('Украина');
});

test('/v1/location POST without userInput', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({}), header);
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/location POST first 2 letters', async () => {
  const userInput = 'Ки';
  const {data, code} = await post(ENDPOINT, JSON.stringify({userInput}), header);
  expect(code).toBe(200);
  expect(data.location[0].city).toEqual('Кикерино');
  expect(data.location[0].country).toEqual('Россия');
});

test('/v1/location POST non-existent city', async () => {
  const userInput = 'nonExistentCity';
  const {data, code} = await post(ENDPOINT, JSON.stringify({userInput}), header);
  expect(code).toBe(200);
  expect(data.location.length).toEqual(0);
});

test('/v1/location empty userInput is 400', async () => {
  const {code} = await post(ENDPOINT, JSON.stringify({userInput: ''}), header);
  expect(code).toBe(400);
});

// TODO(ak239spb): it should be a way to mock google places API in some nice way.
// test('/v1/location POST with sessionToken', async () => {
//   const userInput = 'Ки';
//   const {data, code} = await post(ENDPOINT, JSON.stringify({userInput, sessionToken: '00000000-1111-2222-3333-000000000001'}), header);
//   console.log(data, code);
// });

test('/v1/location POST invalid sessionToken', async () => {
  const userInput = 'Ки';
  {
    const {code} = await post(ENDPOINT, JSON.stringify({userInput, sessionToken: '123'}), header);
    expect(code).toBe(400);
  }
});

test('/v1/location POST without authorization', async () => {
  const userInput = 'Ки';
  {
    const {code} = await post(ENDPOINT, JSON.stringify({userInput, sessionToken: '00000000-1111-2222-3333-000000000001'}), null);
    expect(code).toBe(401);
  }
});
