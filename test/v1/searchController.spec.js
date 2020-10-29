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

const { post, getHost, getAuthHeader, genUsers } = require('../utils.js');

function toExpected(user, isFriend = false) {
  return {
    about: user.about,
    fullName: user.fullName,
    id: user.id,
    imagePath: user.imagePath,
    location: user.location,
    placeId: user.place_id,
    skills: user.skills,
    username: user.username,
    busy: user.busy,
    isFriend
  };
}

describe.only('/v1/search2', () => {
  let authHeader = null;
  const endpoint = getHost() + '/v1/search';
  const postSearch = body => post(endpoint, body, authHeader);
  beforeEach(async () => {
    const [current] = await genUsers(1602998724702, [{}]);
    authHeader = getAuthHeader(current);
  });
  test('/v1/search busy', async () => {
    const [freeUser, busyUser] = await genUsers(1603000265435, [{ busy: false }, { busy: true }]);
    expect(await postSearch({ busy: false, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(freeUser)]) } });
    expect(await postSearch({ busy: true, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(busyUser)]) } });
  });
  test('/v1/search placeId', async () => {
    const [user] = await genUsers(1603000265435, [{ place_id: 'myPlaceId' }]);
    expect(await postSearch({ placeId: 'myPlaceId', count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
  });
  test('/v1/search skills', async () => {
    const [user] = await genUsers(1603000265435, [{ skills: [ 'mySkillA', 'mySkillB', 'mySkillC' ] }]);
    expect(await postSearch({ skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['mySkillB'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['mySkillC'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['mySkillA', 'mySkillC'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['mySkillA', 'mySkillB', 'mySkillC'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['myskilla', 'MySkiLlB', 'mySkillC'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(user)] } });
    expect(await postSearch({ skills: ['abcdef'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ skills: ['mySkillA', 'mySkillB', 'abcdef'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(user)]) } });
  });
  test('/v1/search busy + placeId', async () => {
    const [user] = await genUsers(1603000265435, [{ place_id: 'myPlaceId', busy: true }]);
    expect(await postSearch({ busy: true, placeId: 'myPlaceId', count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: false, placeId: 'myPlaceId', count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: true, placeId: 'myPlaceIdA', count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
  });
  test('/v1/search busy + skills', async () => {
    const [user] = await genUsers(1603000265435, [{ busy: false, skills: ['mySkillA'] }]);
    expect(await postSearch({ busy: false, skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: true, skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: false, skills: ['mySkillB'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
  });
  test('/v1/search placeId + skills', async () => {
    const [user] = await genUsers(1603000265435, [{ place_id: 'myPlaceId', skills: ['mySkillA'] }]);
    expect(await postSearch({ placeId: 'myPlaceId', skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ placeId: 'myPlaceIdA', skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ placeId: 'myPlaceId', skills: ['mySkillB'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
  });
  test('/v1/search busy + placeId + skills', async () => {
    const [user] = await genUsers(1603000265435, [{ busy: true, place_id: 'myPlaceId', skills: ['mySkillA'] }]);
    expect(await postSearch({ busy: true, placeId: 'myPlaceId', skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: false, placeId: 'myPlaceId', skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: true, placeId: 'myPlaceIdA', skills: ['mySkillA'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
    expect(await postSearch({ busy: true, placeId: 'myPlaceId', skills: ['mySkillB'], count: 1000 }))
        .toMatchObject({ code: 200, data: { data: expect.not.arrayContaining([toExpected(user)]) } });
  });
  test('/v1/search pagination', async () => {
    const uniqueSkill = 'mySkillP' + Math.random();
    const users = await genUsers(1603000265435, Array(3).fill({skills: [uniqueSkill]}));
    const actual = [];
    for (let offset = 0; offset < users.length; ++offset) {
      const { data, code } = await postSearch({ skills: [uniqueSkill], count: 1, offset });
      expect(code).toBe(200);
      expect(data.total).toBe(users.length);
      actual.push(...data.data);
    }
    const idOrder = (a,b) => a.id.localeCompare(b.id) || a.fullName.localeCompare(b.fullName);
    expect(users.map(user => toExpected(user)).sort(idOrder)).toStrictEqual(actual.sort(idOrder));
    expect(await postSearch({ skills: [uniqueSkill], count: 1, offset: 6 }))
        .toMatchObject({ code: 200, data: { data: [], total: users.length } });
  });
  test('/v1/search q', async () => {
    const uniqueWord = 'myUniqueWordHm' + Date.now();
    const uniquePlaceId = 'myPlaceId' + Date.now();
    const uniqueSkill = 'jhsgflkewrjf' + Date.now();
    const users = await genUsers(1603000265435, [{
      fullName: uniqueWord,
      place_id: uniquePlaceId,
      busy: true,
      skills: [],
    },{
      place_id: uniquePlaceId,
      busy: false,
      skills: [uniqueWord, uniqueSkill]
    },{
      location: uniqueWord,
      place_id: uniquePlaceId,
      busy: true,
      skills: [uniqueSkill]
    },{
      about: uniqueWord,
      place_id: uniquePlaceId,
      busy: false,
      skills: []
    }]);
    expect(await postSearch({ q: uniqueWord, placeId: uniquePlaceId, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: users.map(user => toExpected(user)) } });
    expect(await postSearch({ q: uniqueWord, busy: true, placeId: uniquePlaceId, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[0]), toExpected(users[2])] } });
    expect(await postSearch({ q: uniqueWord, busy: false, placeId: uniquePlaceId, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[1]), toExpected(users[3])] } });
    expect(await postSearch({ q: uniqueWord, busy: false, skills: [uniqueSkill], placeId: uniquePlaceId, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[1]), toExpected(users[3])] } });
    expect(await postSearch({ q: uniqueWord, busy: true, skills: [uniqueSkill], placeId: uniquePlaceId, count: 1000 }))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[0]), toExpected(users[2])] } });
  });
  test('/v1/search empty', async () => {
    await genUsers(1603000265435, Array(20).fill({}));
    const {code, data: {data, total}} = await postSearch({});
    expect(data.length).toBe(10);
    expect(total).toBeGreaterThanOrEqual(20);
    expect(code).toBe(200);
  });
  test('/v1/search count', async () => {
    const pattern = {id: expect.any(String)};
    await genUsers(1603000265435, Array(5).fill({}));
    expect(await postSearch({ count: 3 }))
        .toMatchObject({ code: 200, data: { data: Array(3).fill(pattern) } });
    expect(await postSearch({ count: 1 }))
        .toMatchObject({ code: 200, data: { data: Array(1).fill(pattern) } });
    expect(await postSearch({ count: 5 }))
        .toMatchObject({ code: 200, data: { data: Array(5).fill(pattern) } });
  });
  test('/v1/search not approved', async () => {
    const uniqueSkill = 'mySkillD' + Math.random();
    const [approved, ] = await genUsers(1603000265435, [{skills: [uniqueSkill]}, {skills: [uniqueSkill], status: 'awaiting'}]);
    expect(await postSearch({ skills: [uniqueSkill] }))
        .toMatchObject({ code: 200, data: { data: [toExpected(approved)], total: 1 } });
  });
  test('/v1/search isFriend', async () => {
    const addFriend = friendId => post(`${getHost()}/v1/user/friend/${friendId}`, {}, authHeader).then(({code}) => expect(code).toBe(201));
    const uniqueWord = 'myUniqueWordHm';
    const place_id = 'myPlaceId';
    const users = await genUsers(1603000265435, [{
      fullName: uniqueWord,
      place_id
    },{
      skills: [uniqueWord],
      place_id
    },{
      location: uniqueWord,
      place_id
    },{
      about: uniqueWord,
      place_id
    }]);
    await addFriend(users[0].id);
    await addFriend(users[2].id);
    expect(await postSearch({ isFriend: true, q: uniqueWord, placeId: place_id}))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[0], true), toExpected(users[2], true)], total: 2 } });
    expect(await postSearch({ isFriend: false, q: uniqueWord, placeId: place_id}))
        .toMatchObject({ code: 200, data: { data: [toExpected(users[0], true), toExpected(users[1], false), toExpected(users[2], true), toExpected(users[3], false)], total: 4 } });
  });
  test('/v1/search 400', async () => {
    expect(await post(endpoint, {})).toMatchObject({ code: 401 });
    expect(await postSearch({ q: 'a'.repeat(256) })).toMatchObject({ code: 400 });
    expect(await postSearch({ q: [] })).toMatchObject({ code: 400 });
    expect(await postSearch({ q: {} })).toMatchObject({ code: 400 });
    expect(await postSearch({ placeId: 'a'.repeat(65) })).toMatchObject({ code: 400 });
    expect(await postSearch({ skills: 'abc' })).toMatchObject({ code: 400 });
    expect(await postSearch({ skills: [[]] })).toMatchObject({ code: 400 });
    expect(await postSearch({ skills: [''] })).toMatchObject({ code: 400 });
    expect(await postSearch({ skills: ['a'.repeat(256)] })).toMatchObject({ code: 400 });
    expect(await postSearch({ count: 2.5 })).toMatchObject({ code: 400 });
    expect(await postSearch({ count: 0 })).toMatchObject({ code: 400 });
    expect(await postSearch({ count: 1001 })).toMatchObject({ code: 400 });
    expect(await postSearch({ offset: 2.5 })).toMatchObject({ code: 400 });
    expect(await postSearch({ offset: -1 })).toMatchObject({ code: 400 });
    expect(await postSearch({ busy: 'abc' })).toMatchObject({ code: 400 });
    expect(await postSearch({ busy: 10 })).toMatchObject({ code: 400 });
    expect(await postSearch({ isFriend: 'abc' })).toMatchObject({ code: 400 });
    expect(await postSearch({ isFriend: 10 })).toMatchObject({ code: 400 });
  });
});
