/**
 * Copyright (c) Mesto.co
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { post, getHost, getAuthHeader, genUsers } = require('../utils.js');

describe('/v1/openland', () => {
  let authHeader = null;
  const setNextCode = (code, expiration) => post(getHost() + '/v1/admin/setNextOpenlandCodeForTest', {code, expiration});
  const postSendCode = body => post(getHost() + '/v1/openland/sendCode', body, authHeader);
  const verifyCode = (body, authOverride) => post(getHost() + '/v1/openland/verifyCode', body, authOverride || authHeader);
  beforeEach(async () => {
    const [current] = await genUsers(1603057344437, [{}]);
    authHeader = getAuthHeader(current);
  });
  test('/v1/openland/sendCode', async () => {
    expect(await postSendCode({openland: 'a'.repeat(64) }))
        .toMatchObject({ code: 404 });
    {
      // happy path
      expect(await setNextCode('000000')).toMatchObject({ code: 200 });
      const result = await postSendCode({openland: 'LOaDEWDjrbt1Qq7EZwXQhY6j61' });
      expect(result).toMatchObject({ code: 200, data: { codeId: expect.any(String) } });
      expect(await verifyCode({ codeId: result.data.codeId, code: '000000' }))
          .toMatchObject({code: 200, data: {}});
    }
    {
      // expired code
      expect(await setNextCode('000000', -1)).toMatchObject({ code: 200 });
      const result = await postSendCode({openland: 'LOaDEWDjrbt1Qq7EZwXQhY6j61' });
      expect(result).toMatchObject({ code: 200, data: { codeId: expect.any(String) } });
      expect(await verifyCode({ codeId: result.data.codeId, code: '000000' }))
          .toMatchObject({code: 401, data: {}});
    }
    {
      // another user
      const [user] = await genUsers(1603084501057, [{}]);
      const auth = getAuthHeader(user);
      expect(await setNextCode('000000', -1)).toMatchObject({ code: 200 });
      const result = await postSendCode({openland: 'LOaDEWDjrbt1Qq7EZwXQhY6j61' });
      expect(result).toMatchObject({ code: 200, data: { codeId: expect.any(String) } });
      expect(await verifyCode({ codeId: result.data.codeId, code: '000000' }, auth))
          .toMatchObject({code: 401, data: {}});
    }
    expect(await postSendCode({})).toMatchObject({ code: 400 });
    expect(await postSendCode({ openland: 'a'.repeat(65) })).toMatchObject({ code: 400 });
    expect(await verifyCode({})).toMatchObject({ code: 400 });
    expect(await verifyCode({ codeId: 'a'.repeat(257) })).toMatchObject({ code: 400 });
    expect(await verifyCode({ code: '' })).toMatchObject({ code: 400 });
    expect(await verifyCode({ code: '1234567' })).toMatchObject({ code: 400 });
  });

  const postGetUser = body => post(getHost() + '/v1/openland/getUser', body, authHeader);
  test('/v1/openland/getUser', async () => {
    const expectedData = {
      fullName: 'MestoTest Bot',
      imagePath: expect.any(String),
      username: 'mestotest',
      location: 'MestoTestLocation',
      about: 'MestoTestAbout',
      contacts: expect.arrayContaining([{
        title: 'openland',
        url: 'https://openland.com/mestotest',
      },
      {
        title: 'website',
        url: 'https://example.com',
      },
      {
        title: 'linkedin',
        url: 'mestolinkedin',
      },
      {
        title: 'instagram',
        url: 'mestoinstragram',
      },
      {
        title: 'twitter',
        url: 'mestotwitter',
      },
      {
        title: 'facebook',
        url: 'mestofacebook',
      }])
    };
    expect(await postGetUser({openland: 'mestotest'}))
        .toMatchObject({ code: 200, data: { data: expectedData }});
    expect(await postGetUser({openland: '@mestotest'}))
        .toMatchObject({ code: 200, data: { data: expectedData }});
    expect(await postGetUser({openland: '4dkbJabjJkiVrMpBebLlCbzLQJ'}))
        .toMatchObject({ code: 200, data: { data: expectedData }});
    expect(await postGetUser({openland: 'https://openland.com/4dkbJabjJkiVrMpBebLlCbzLQJ'}))
        .toMatchObject({ code: 200, data: { data: expectedData }});
    expect(await postGetUser({openland: 'https://openland.com/mestotest'}))
        .toMatchObject({ code: 200, data: { data: expectedData }});
    expect(await postGetUser({})).toMatchObject({ code: 400 });
    expect(await postGetUser({ openland: 'a'.repeat(64) })).toMatchObject({ code: 404 });
    expect(await postGetUser({ openland: 'a'.repeat(65) })).toMatchObject({ code: 400 });
  });
});
