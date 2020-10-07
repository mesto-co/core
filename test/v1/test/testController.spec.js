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
const { get, post, put, del, getHost } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/test/`;

test('/v1/test/:id', async () => {
  const testEntry = {
    fieldA: 42,
    fieldB: 'abc'
  };
  const {data: createData, code: createCode} = await post(ENDPOINT, JSON.stringify({...testEntry}));
  expect(createCode).toBe(200);
  expect(createData.id).toBeDefined();

  const {data: getData, code: getCode} = await get(ENDPOINT + createData.id);
  expect(getCode).toBe(200);
  expect(getData).toEqual({id: createData.id, ...testEntry});

  testEntry.fieldA = 239;
  testEntry.fieldB = 'cba';
  const {code: updateCode} = await put(ENDPOINT + createData.id, JSON.stringify({...testEntry}));
  expect(updateCode).toBe(200);

  const {data: getDataAfterUpdate, code: getCodeAfterUpdate} = await get(ENDPOINT + createData.id);
  expect(getCodeAfterUpdate).toBe(200);
  expect(getDataAfterUpdate).toEqual({id: createData.id, ...testEntry});

  const {code: deleteCode} = await del(ENDPOINT + createData.id);
  expect(deleteCode).toBe(200);

  const {code: getCodeAfterDelete} = await get(ENDPOINT + createData.id);
  expect(getCodeAfterDelete).toBe(404);
});

test('/v1/test/ POST without fieldA', async () => {
  const {data, code} = await post(ENDPOINT, JSON.stringify({fieldB: 'abc'}));
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});

test('/v1/test/:id GET with id that does not exist', async () => {
  const {code} = await get(ENDPOINT + '1234567');
  expect(code).toBe(404);
});
