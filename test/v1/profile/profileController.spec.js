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
const { get, post, getHost, getAuthHeader, put, genUsers: genUsersInternal } = require('../../utils.js');

const ENDPOINT = `${getHost()}/v1/profile/search`;
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

function genUsers(users) {
  return genUsersInternal(9, users);
}

beforeAll(() => {
  return get(`${getHost()}/v1/admin/invalidateSearchIndex`);
});

test('/v1/search/ POST', async () => {
  const [{fullName, location}] = await genUsers([{
    busy: true
  }]);
  const testEntry = {'perPage': 100,'query': [{fullName: fullName.split(' ')[0], location}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].fullName).toEqual(fullName);
  expect(getSearchData.entries.data[0].location).toEqual(location);
  expect(getSearchData.entries.data[0].busy).toEqual(true);
});

test('/v1/search/ POST two correct words: firstName and lastName', async () => {
  const users = await genUsers([{busy: true}]);
  const {id, fullName, username, imagePath} = users[0];
  const [firstName, lastName] = fullName.split(' ');
  const testEntry = {'perPage': 100,'query': [{'fullName': firstName.toLowerCase()},{'fullName': lastName}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].email).toBeUndefined();
  expect(getSearchData.entries.data[0].username).toEqual(username);
  expect(getSearchData.entries.data[0].fullName).toEqual(fullName);
  expect(getSearchData.entries.data[0].imagePath).toEqual(imagePath);
  expect(getSearchData.entries.data[0].id).toEqual(id);
  expect(getSearchData.entries.data[0].busy).toEqual(true);
});

test('/v1/search/ POST two words: firstName and wrong lastName', async () => {
  const [{fullName, busy}] = await genUsers([{}]);
  const [firstName, lastName] = fullName.split(' ');
  const testEntry = {'perPage': 100,'query': [{'fullName': firstName.toLowerCase()},{'fullName': lastName.substr(lastName.length - 2) + 'ич'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].fullName).toEqual(fullName);
  expect(getSearchData.entries.data[0].busy).toEqual(busy);
});

test('/v1/search/ POST param that does not exists', async () => {
  await genUsers([{}]);
  const testEntry = {'perPage': 100,'query': [{'gender': 'девушка'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).not.toEqual([]);
});

test('/v1/search/ POST without perPage and currentPage and with empty query', async () => {
  await genUsers([{}]);
  const testEntry = {'query': []};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).not.toEqual([]);
});


test('/v1/search/ POST with wrong page number', async () => {
  const [{fullName}] = await genUsers([{}]);

  const testEntry = {'perPage': 100,'query': [{fullName}]};
  testEntry.currentPage = 2;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with no existing user', async () => {
  const testEntry = {'perPage': 100,'query': [{'fullName': '///'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with sql injection attempt', async () => {
  await genUsers([{
    fullName: 'Иван Рябинин',
    imagePath: 'https://cdn.mesto.co/a.png',
    busy: true
  }]);

  const testEntry = {'perPage': 100,'query': [{'fullName': `несуществующееимя'+OR+1=1--`, 'location': `несуществующееимя'+OR+1=1--`}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data).toEqual([]);
});

test('/v1/search/ POST with skills', async () => {
  const [{skills}] = await genUsers([{skills: ['/v1/search' + Date.now()]}]);
  const testEntry = {'perPage': 100,'query': [{skills: skills[0]}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry),header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data[0].skills[0]).toEqual(skills[0]);
});

test('/v1/search/ POST with exceed the limit', async () => {
  const testEntry = {'perPage': 1001,'query': [{'fullName': 'Иван','location': 'Иван'}]};
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(400);
  expect(getSearchData.message).toEqual('should be <= 1000');
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
  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry));
  expect(code).toBe(401);
});

test('/v1/search/ POST with access token algorithm none', async () => {
  const invalidHeader = getAuthHeader({
    id: '00000000-1111-2222-3333-000000000001',
    fullName: 'Иван Рябинин',
  }, 'none');

  const testEntry = {'perPage': 100,'query': [{'fullName': 'Иван','location': 'Иван'}]};
  const {code} = await post(ENDPOINT, JSON.stringify(testEntry), invalidHeader);
  expect(code).toBe(401);
});

test('/v1/search/ POST emtpy string is 400', async () => {
  await check([{fullName: ''}]);
  await check([{location: ''}]);
  await check([{about: ''}]);
  await check([{skills: ''}]);

  async function check(query) {
    const {code} = await post(ENDPOINT, JSON.stringify({query: query}), header);
    expect(code).toBe(400);
  }
});

test('/v1/search/ POST empty query', async () => {
  await genUsers([{}]);

  const testEntry = {'perPage': 100,'query': []};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data.length).toBeGreaterThan(0);
});

describe('/v1/search Сергей', () => {
  const skill = 'randomskill';
  const about = 'randomabout';
  const prefix = Date.now();
  beforeEach(() => genUsers([{
    fullName: prefix + 'Сергей',
    location: '',
    busy: false,
    skills: [skill]
  },
  {
    fullName: prefix + 'Sergey',
    location: '',
    busy: true,
    about: about,
    skills: [skill]
  },
  {
    fullName: prefix + 'Sergei',
    location: '',
    busy: false,
    skills: []
  },
  {
    fullName: 'Игорь',
    location: prefix + 'Сергеев',
    busy: true,
    skills: []
  },
  {
    fullName: 'Никита',
    location: '',
    busy: false,
    skills: [prefix + 'сергей']
  },
  {
    fullName: 'Игорь',
    about: 'Помогаю только ' + prefix + 'Сергеям',
    location: '',
    busy: true,
    skills: ['микроконтроллеры']
  }]));

  test('/v1/search/ POST Сергей', async () => {
    const testEntry = {'perPage': 100,'query': [{'fullName': prefix + 'Сергей'}]};
    testEntry.currentPage = 1;
    const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
    expect(searchCode).toBe(200);
    expect(getSearchData.entries.data.length).toBe(5);
    const [serg1, serg2, serg3, nik, igor1] = getSearchData.entries.data;
    const sergs = [serg1,serg2,serg3].sort((a,b) => a.fullName.localeCompare(b.fullName));
    expect(getSearchData.entries.total).toBe(5);
    expect(sergs[0].fullName).toBe(prefix + 'Sergei');
    expect(sergs[0].busy).toEqual(false);
    expect(sergs[1].fullName).toBe(prefix + 'Sergey');
    expect(sergs[1].busy).toEqual(true);
    expect(sergs[2].fullName).toBe(prefix + 'Сергей');
    expect(sergs[2].busy).toEqual(false);
    expect(nik.skills[0]).toBe(prefix + 'сергей');
    expect(igor1.location).toBe(prefix + 'Сергеев');
  });

  test('/v1/search/ POST Сергей (space at the end)', async () => {
    const testEntry = {'perPage': 100,'query': [{'fullName': prefix + 'Сергей '}]};
    testEntry.currentPage = 1;
    const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
    expect(searchCode).toBe(200);
    expect(getSearchData.entries.data.length).toBe(5);
    const [serg1, serg2, serg3, nik, igor1] = getSearchData.entries.data;
    const sergs = [serg1,serg2,serg3].sort((a,b) => a.fullName.localeCompare(b.fullName));
    expect(getSearchData.entries.total).toBe(5);
    expect(sergs[0].fullName).toBe(prefix + 'Sergei');
    expect(sergs[0].busy).toEqual(false);
    expect(sergs[1].fullName).toBe(prefix + 'Sergey');
    expect(sergs[1].busy).toEqual(true);
    expect(sergs[2].fullName).toBe(prefix + 'Сергей');
    expect(sergs[2].busy).toEqual(false);
    expect(nik.skills[0]).toBe(prefix + 'сергей');
    expect(igor1.location).toBe(prefix + 'Сергеев');
  });

  test('/v1/search/ POST Сергей startup', async () => {
    const testEntry = {'perPage': 100,'query': [{'fullName': prefix + 'Сергей', 'skills': skill}]};
    testEntry.currentPage = 1;
    const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
    expect(searchCode).toBe(200);
    const [serg1, serg2, serg3] = getSearchData.entries.data;
    const sergs = [serg1,serg2].sort((a,b) => a.fullName.localeCompare(b.fullName));
    expect(sergs[0].fullName).toBe(prefix + 'Sergey');
    expect(sergs[0].skills[0]).toBe(skill);
    expect(sergs[1].fullName).toBe(prefix + 'Сергей');
    expect(sergs[1].skills[0]).toBe(skill);
    expect(serg3.fullName).toBe(prefix + 'Sergei');
    expect(serg3.skills.length).toBe(0);
  });

  test('/v1/search/ POST Сергей startup местный', async () => {
    const testEntry = {'perPage': 100,'query': [{'fullName': prefix + 'Сергей', 'skills': skill, 'about': about}]};
    testEntry.currentPage = 1;
    const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
    expect(searchCode).toBe(200);
    const [serg1, serg2, serg3] = getSearchData.entries.data;
    expect(serg1.fullName).toBe(prefix + 'Sergey');
    expect(serg1.skills[0]).toBe(skill);
    expect(serg1.about).toBe(about);
    expect(serg2.fullName).toBe(prefix + 'Сергей');
    expect(serg2.skills[0]).toBe(skill);
    expect(serg3.fullName).toBe(prefix + 'Sergei');
    expect(serg3.skills.length).toBe(0);
  });

  test('/v1/search/ POST микр', async () => {
    const testEntry = {'perPage': 100,'query': [{'skills': 'микр'}]};
    testEntry.currentPage = 1;
    const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
    expect(searchCode).toBe(200);
    expect(getSearchData.entries.total).toBe(1);
    const [igor] = getSearchData.entries.data;
    expect(igor.fullName).toBe('Игорь');
    expect(igor.skills[0]).toBe('микроконтроллеры');
  });
});

test('/v1/search/ POST cache is invalidated', async () => {
  const userData = {
    id: '00000000-1111-2222-3333-000000000016',
    fullName: 'Безликий',
    about: 'Нет about',
    location: 'location',
    skills: []
  };
  await genUsers([userData]);

  const testEntry = {'perPage': 100,'query': [{'fullName': 'Бронтозябр'}]};
  testEntry.currentPage = 1;
  const {data: getSearchData, code: searchCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchCode).toBe(200);
  expect(getSearchData.entries.data.length).toBe(0);

  const userHeader = getAuthHeader({
    id: userData.id,
    fullName: userData.fullName
  });
  userData.fullName = 'Бронтозябр';
  const {code: updateCode} = await put(`${getHost()}/v1/user`, JSON.stringify(userData), userHeader);
  expect(updateCode).toBe(200);

  const {data: getAfterSearchData, code: searchAfterCode} = await post(ENDPOINT, JSON.stringify(testEntry), header);
  expect(searchAfterCode).toBe(200);
  expect(getAfterSearchData.entries.data.length).toBe(1);
  expect(getAfterSearchData.entries.data[0].fullName).toBe(userData.fullName);

  userData.fullName = 'Безликий';
  const {code: restoreCode} = await put(`${getHost()}/v1/user`, JSON.stringify(userData), userHeader);
  expect(restoreCode).toBe(200);
});

test('/v1/admin/invalidateSearchIndex only available for admin account', async () => {
  const userHeader = getAuthHeader({
    id: '00000000-1111-2222-3333-000000000016',
    fullName: 'Безликий'
  });
  const {code} = await post(`${getHost()}/v1/admin/invalidateSearchIndex`, JSON.stringify({userIds: []}), userHeader);
  expect(code).toBe(401);
  const {code: withoutUserCode} = await get(`${getHost()}/v1/admin/invalidateSearchIndex`);
  expect(withoutUserCode).toBe(401);
});
