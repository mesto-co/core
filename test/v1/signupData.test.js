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

const {getAuthHeader, getHost, genUsers, registerUser, post, get} = require('../utils.js');
const faker = require('faker');

const ADD_PERMISSION_ID = 23;
const GET_PERMISSION_ID = 24;

describe('#POST>/v1/signupData', () => {
  test('without authorization', async () => {
    expect(await post(getHost() + '/v1/signupData', {email: 'a@a.com', name: 'a a'})).toMatchObject({code: 401});
  });
  test('without permission', async () => {
    const authHeader = getAuthHeader({permissions: []});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
    }, authHeader)).toMatchObject({code: 401});
  });
  test('without name', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      email: 'mesto@example.com',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('name')},
    });
  });
  test('without email', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('email')},
    });
  });
  test('usedId is not uuid', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      userId: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('userId')},
    });
  });
  test('birthdate is not date', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      birthdate: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('birthdate')},
    });
  });
  test('birthdatePrecision is not year/month/day', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      birthdatePrecision: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('birthdatePrecision')},
    });
  });
  test('heardAboutUs is not an array', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      heardAboutUs: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('heardAboutUs')},
    });
  });
  test('groups is not an array', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      groups: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('groups')},
    });
  });
  test('canHelp is not an array', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      canHelp: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('canHelp')},
    });
  });
  test('lookingFor is not an array', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      lookingFor: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('lookingFor')},
    });
  });
  test('projectType is not an array', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      projectType: 'aaa',
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('projectType')},
    });
  });
  test('pass non existing userId', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      userId: 'caa3931e-4d55-4e3e-b7b6-dca7cd0df1b6',
    }, authHeader)).toMatchObject({
      code: 404,
      data: {message: expect.stringContaining('userId')},
    });
  });
  test('pass email that differs from the existing one for given user', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    const [user] = await genUsers(1665948641842, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: 'mesto@example.com',
      userId: user.id,
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('email')},
    });
  });

  test('pass another data for the same email', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    const [user] = await genUsers(1665948641842, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: user.email,
    }, authHeader)).toMatchObject({
      code: 200,
      data: {userId: user.id},
    });
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: user.email,
    }, authHeader)).toMatchObject({
      code: 400,
      data: {message: expect.stringContaining('Given user has signupData')},
    });
  });

  test('add data for existing user', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: user.email,
      userId: user.id,
    }, authHeader)).toMatchObject({
      code: 200,
      data: {userId: user.id},
    });
  });

  test('add data for existing user if email matches', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich',
      email: user.email,
    }, authHeader)).toMatchObject({
      code: 200,
      data: {userId: user.id},
    });
  });

  test('prefer existing fullName', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich', email: user.email, userId: user.id
    }, authHeader)).toMatchObject({ code: 200 });
    expect(await get(getHost() + '/v1/signupData/' + user.id, authHeader)).toMatchObject({
      code: 200,
      data: {
        userId: user.id,
        name: user.fullName,
      }
    });
  });

  test('prefer existing about', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich', about: 'about me!', email: user.email, userId: user.id
    }, authHeader)).toMatchObject({ code: 200 });
    expect(await get(getHost() + '/v1/signupData/' + user.id, authHeader)).toMatchObject({
      code: 200,
      data: {
        userId: user.id,
        name: user.fullName,
        aboutMe: user.about,
      }
    });
  });

  test('prefer existing about event if not passed', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      name: 'Mesto Mestovich', email: user.email, userId: user.id
    }, authHeader)).toMatchObject({ code: 200 });
    expect(await get(getHost() + '/v1/signupData/' + user.id, authHeader)).toMatchObject({
      code: 200,
      data: {
        userId: user.id,
        name: user.fullName,
        aboutMe: user.about,
      }
    });
  });

  test('auth with h-captcha good response', async () => {
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      'name': 'Mesto Mestovich',
      'email': user.email,
      'userId': user.id,
      'h-captcha-response': '10000000-aaaa-bbbb-cccc-000000000001',
    })).toMatchObject({
      code: 200,
      data: {userId: user.id},
    });
  });

  test('auth with h-captcha wrong reponse', async () => {
    const [user] = await genUsers(1665950612801, [{}]);
    expect(await post(getHost() + '/v1/signupData', {
      'name': 'Mesto Mestovich',
      'email': user.email,
      'userId': user.id,
      'h-captcha-response': 'wrong-key',
    })).toMatchObject({
      code: 401,
    });
  });

  test('create user if needed', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID]});
    faker.seed(1665953188076);
    const user = {
      email: faker.internet.email(),
      name: faker.name.firstName() + ' ' + faker.name.lastName(),
    };
    const result = await post(getHost() + '/v1/signupData', {
      name: user.name, email: user.email,
    }, authHeader);
    registerUser(result.data.userId);
    expect(result).toMatchObject({ code: 200, data: {
      userId: expect.any(String),
    }});
    // User should be created with awaiting status.
    expect(await post(getHost() + '/v1/auth/magicLink', {
      email: user.email,
    })).toMatchObject({ code: 404});
  });

  test('pass through all fields', async () => {
    const authHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    faker.seed(1665954587668);
    const user = {
      email: faker.internet.email(),
      name: faker.name.firstName() + ' ' + faker.name.lastName(),
      birthdate: new Date().toISOString().substring(0, 10),
      birthdatePrecision: 'month',
      country: faker.address.country(),
      socialMediaLink: faker.image.imageUrl(),
      telegram: faker.datatype.string(),
      heardAboutUs: [faker.datatype.string(), faker.datatype.string()],
      aboutMe: faker.datatype.string(),
      profession: faker.datatype.string(),
      professionDetails: faker.datatype.string(),
      groups: [faker.datatype.string()],
      projectType: [faker.datatype.string()],
      projectDetails: faker.datatype.string(),
      canHelp: [faker.datatype.string(), faker.datatype.string()],
      lookingFor: [faker.datatype.string(), faker.datatype.string(), faker.datatype.string()],
    };
    const result = await post(getHost() + '/v1/signupData', user, authHeader);
    registerUser(result.data.userId);
    expect(result).toMatchObject({code: 200, data: {userId: expect.any(String)}});
    user.birthdate += 'T00:00:00.000Z';
    delete user.email;
    expect(await get(getHost() + '/v1/signupData/' + result.data.userId, authHeader))
        .toMatchObject({code: 200, data: user});
  });
});

describe('#GET>/v1/singupData/:id', () => {
  let adminAuthHeader;
  let userAuthHeader;
  let user;
  beforeAll(async () => {
    adminAuthHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    [user] = await genUsers(1665950618649, [{}], true);
    userAuthHeader = getAuthHeader({id: user.id});
    expect(await post(getHost() + '/v1/signupData', {
      name: user.fullName,
      email: user.email,
      userId: user.id,
    }, adminAuthHeader)).toMatchObject({code: 200});
  });
  test('without permission', async () => {
    expect(await get(getHost() + '/v1/signupData/' + user.id))
        .toMatchObject({code: 401});
  });
  test('with another user auth', async () => {
    const anotherUserAuthHeader = getAuthHeader({id: 'another-one'});
    expect(await get(getHost() + '/v1/signupData/' + user.id, anotherUserAuthHeader))
        .toMatchObject({code: 401});
  });
  test('with permission', async () => {
    expect(await get(getHost() + '/v1/signupData/' + user.id, adminAuthHeader))
        .toMatchObject({code: 200});
  });
  test('do not return email', async () => {
    const result = await get(getHost() + '/v1/signupData/' + user.id, adminAuthHeader);
    expect(result.code).toBe(200);
    expect(result.data.email).toBeUndefined();
  });
  test('with current user auth', async () => {
    expect(await get(getHost() + '/v1/signupData/' + user.id, userAuthHeader))
        .toMatchObject({code: 200, data: {userId: user.id, name: user.fullName}});
  });
  test('userId is not uuid', async () => {
    expect(await get(getHost() + '/v1/signupData/non-existing-user', adminAuthHeader))
        .toMatchObject({code: 400, data: {message: expect.stringContaining('userId')}});
  });
  test('non existing signupData', async () => {
    expect(await get(getHost() + '/v1/signupData/caa3931e-4d55-4e3e-b7b6-dca7cd0df1b6', adminAuthHeader))
        .toMatchObject({code: 404, data: {message: expect.stringContaining('userId')}});
  });
});

describe('#POST>/v1/singupData/:id', () => {
  let adminAuthHeader;
  let userAuthHeader;
  let user;
  beforeAll(async () => {
    adminAuthHeader = getAuthHeader({permissions: [ADD_PERMISSION_ID, GET_PERMISSION_ID]});
    [user] = await genUsers(1665950618651, [{}], true);
    userAuthHeader = getAuthHeader({id: user.id});
    expect(await post(getHost() + '/v1/signupData', {
      name: user.fullName,
      email: user.email,
      userId: user.id,
    }, adminAuthHeader)).toMatchObject({code: 200});
  });
  test('without permission', async () => {
    expect(await post(getHost() + '/v1/signupData/' + user.id, {}))
        .toMatchObject({code: 401});
  });
  test('with another user auth', async () => {
    const anotherUserAuthHeader = getAuthHeader({id: 'another-one'});
    expect(await post(getHost() + '/v1/signupData/' + user.id, {}, anotherUserAuthHeader))
        .toMatchObject({code: 401});
  });
  test('with permission', async () => {
    expect(await post(getHost() + '/v1/signupData/' + user.id, {}, adminAuthHeader))
        .toMatchObject({code: 200});
  });
  test('with current user auth', async () => {
    expect(await post(getHost() + '/v1/signupData/' + user.id, {}, userAuthHeader))
        .toMatchObject({code: 200, data: {userId: user.id}});
  });
  test('userId is not uuid', async () => {
    expect(await post(getHost() + '/v1/signupData/non-existing-user', {}, adminAuthHeader))
        .toMatchObject({code: 400, data: {message: expect.stringContaining('userId')}});
  });
  test('non existing signupData', async () => {
    expect(await post(getHost() + '/v1/signupData/caa3931e-4d55-4e3e-b7b6-dca7cd0df1b6', {}, adminAuthHeader))
        .toMatchObject({code: 404, data: {message: expect.stringContaining('userId')}});
  });
  test('update name', async () => {
    expect(await post(getHost() + '/v1/signupData/' + user.id, {name: user.fullName + '!'}, userAuthHeader))
        .toMatchObject({code: 200, data: {userId: user.id}});
    expect(await get(getHost() + '/v1/signupData/' + user.id, userAuthHeader))
        .toMatchObject({code: 200, data: {name: user.fullName + '!'}});
  });
  test('update all', async () => {
    faker.seed(1665972559513);
    const data = {
      name: faker.name.firstName() + ' ' + faker.name.lastName(),
      birthdate: new Date().toISOString().substring(0, 10),
      birthdatePrecision: 'month',
      country: faker.address.country(),
      socialMediaLink: faker.image.imageUrl(),
      telegram: faker.datatype.string(),
      heardAboutUs: [faker.datatype.string(), faker.datatype.string()],
      aboutMe: faker.datatype.string(),
      profession: faker.datatype.string(),
      professionDetails: faker.datatype.string(),
      groups: [faker.datatype.string()],
      projectType: [faker.datatype.string()],
      projectDetails: faker.datatype.string(),
      canHelp: [faker.datatype.string(), faker.datatype.string()],
      lookingFor: [faker.datatype.string(), faker.datatype.string(), faker.datatype.string()],
    };
    expect(await post(getHost() + '/v1/signupData/' + user.id, data, adminAuthHeader))
        .toMatchObject({code: 200, data: {userId: user.id}});
    data.birthdate += 'T00:00:00.000Z';
    expect(await get(getHost() + '/v1/signupData/' + user.id, adminAuthHeader))
        .toMatchObject({code: 200, data: data});
  });
});

