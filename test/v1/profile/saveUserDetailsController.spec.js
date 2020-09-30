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
const { put, getHost, getRqUid, getAuthHeader } = require('../../utils.js');
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000008',
  fullName: 'Volodymyr',
});

const ENDPOINT = `${getHost()}/v1/user`;
const RqUid = getRqUid();
const about = 'Я пишу о себе';
const location = 'Киев, Украина';
const skills = ['Improvements'];
const role = 'Менеджер';
const fullName = 'Volodymyr';

test('/v1/user', async () => {
  const {data, code} = await put(ENDPOINT, JSON.stringify({RqUid, location, about, skills, role, fullName }), header);
  expect(code).toBe(200);
  expect(data.RqUid).toEqual(RqUid);
});

test('/v1/user PUT without userInput', async () => {
  const {data, code} = await put(ENDPOINT, JSON.stringify({RqUid}), header);
  expect(code).toBe(400);
  expect(data.RqUid).toEqual(RqUid);
});

test('/v1/user PUT without RqUid', async () => {
  const {code} = await put(ENDPOINT, JSON.stringify({location, about, skills, role, fullName}), header);
  expect(code).toBe(400);
});

test('/v1/user PUT skills are not an array', async () => {
  const about = 'Я пишу о себе';
  const location =  'Киев, Украина';
  const skills = 'not an array';
  const {data, code} = await put(ENDPOINT, JSON.stringify({RqUid, location, about, skills}), header);
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});


test('/v1/user PUT skill item is not a string', async () => {
  const about = 'Я пишу о себе';
  const location =  'Киев, Украина';
  const skills = [1, 2, 3];
  const {data, code} = await put(ENDPOINT, JSON.stringify({RqUid, location, about, skills}), header);
  expect(code).toBe(400);
  expect(data.message).toBeDefined();
});
