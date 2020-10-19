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

const jsonwebtoken = require('jsonwebtoken');

const { get, getAuthHeader, getHost, genUsers } = require('../utils.js');
const { peerboardAuthToken } = require('../../config.js');

describe('/v1/peerboard', () => {
  const auth = authHeader => get(getHost() + '/v1/peerboard/auth', authHeader);
  test('/v1/peerboard/auth', async () => {
    expect(await auth()).toMatchObject({ code: 401 });

    const [user] = await genUsers(1603094014186, [{}]);
    const authHeader = getAuthHeader(user);
    const result = await auth(authHeader);
    expect(result).toMatchObject({ code: 200, data: { token: expect.any(String) }});
    await new Promise(resolve => jsonwebtoken.verify(result.data.token, peerboardAuthToken, async (err, decoded) => {
      expect(err).toBeNull();
      expect(decoded).toMatchObject({
        creds: {
          v: 'v1',
          fields: {
            user_id: user.id,
            email: user.email,
            name: user.fullName,
            avatar_url: user.imagePath,
            bio: user.about,
            role: 'member'
          }
        }
      });
      resolve();
    }));
  });
});
