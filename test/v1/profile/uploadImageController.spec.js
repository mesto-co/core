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
const http = require('http');

const fs = require('fs');
const os = require('os');
const FormData = require('form-data');
const ENDPOINT = `${getHost()}/v1/profile/uploadImage`;
const TEST_FILE = './test/v1/profile/data/test-avatar.jpg';
const authHeader = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

test('/v1/profile/uploadImage POST with invalid MIME type', async () => {
  const {code, data} = await uploadImage(TEST_FILE, 'image/tiff');
  expect(code).toBe(500);
  expect(data.errorCode).toBe(1);
});

test('/v1/profile/uploadImage POST', async () => {
  const {code, data} = await uploadImage(TEST_FILE, 'image/jpeg');
  expect(code).toBe(200);
  expect(data.path).toBeDefined();
  expect(data.url).toBeDefined();
});

test('/v1/profile/uploadImage POST with too large file', async () => {
  const largeFile = os.tmpdir() + '/large.dat';
  try {
    // preparing large file
    for (let i = 0; i < 5; i++)
      await fs.promises.appendFile(largeFile, await fs.promises.readFile(TEST_FILE));

    const {code, data} = await uploadImage(largeFile, 'image/jpeg');

    expect(code).toBe(500);
    expect(data.errorCode).toBe(2);
  } finally {
    // cleaning out
    await fs.promises.unlink(largeFile);
  }
});

test('/v1/profile/uploadImage POST without access token', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry));
  expect(code).toBe(401);
});

test('/v1/profile/uploadImage POST with access token algorithm none', async () => {
  const invalidHeader = getAuthHeader({
    id: '00000000-1111-2222-3333-000000000001',
    fullName: 'Иван Рябинин',
  }, 'none');

  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','username': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry), invalidHeader);
  expect(code).toBe(401);
});

function uploadImage(file, mimeType) {
  const form = new FormData();
  form.append('file', fs.createReadStream(file), {filename: 'test.jpg', contentType: mimeType});

  let requestFinished;
  const requestPromise = new Promise(resolve => requestFinished = resolve);
  const req = http.request(ENDPOINT, { method: 'POST', headers: { ...form.getHeaders(), ...authHeader, 'X-Request-Id': 'd5ab3356-f4b4-11ea-adc1-0242ac120002' } }, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      requestFinished({data: data ? JSON.parse(data) : {}, code: res.statusCode});
    });
  });

  form.pipe(req);
  return requestPromise;
}
