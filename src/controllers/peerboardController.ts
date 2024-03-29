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

import express from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { URL } from 'url';

import knex from '../knex';
import { UserStatus } from '../enums/UserStatus';
const { peerboardAuthToken, peerboardAuthTokenOverrides, peerboardProfileUrl, peerboardProfileUrlOverrides } = require('../../config.js');
const config = require('../../config.js');

const getPeerboardAuthToken = (request: express.Request) => {
  try {
    const referer = request.headers['referer'];
    if (referer && peerboardAuthTokenOverrides)
      return peerboardAuthTokenOverrides[new URL(referer).hostname] || peerboardAuthToken;
  } catch (e) {
  }
  return peerboardAuthToken;
};

const getPeerboardProfileUrl = (request: express.Request) => {
  try {
    const referer = request.headers['referer'];
    if (referer && peerboardProfileUrlOverrides)
      return peerboardProfileUrlOverrides[new URL(referer).hostname] || peerboardProfileUrl;
  } catch (e) {
  }
  return peerboardProfileUrl;
};

const peerboardAuthControler = express.Router();
peerboardAuthControler.route('/').get(async (request, response) => {
  try {
    const id = request.user!.id;
    const result: { rows: {
      email: string,
      fullName: string,
      imagePath: string|null,
      about: string
    }[] } = await knex.raw('SELECT email, "fullName", "imagePath", about FROM "User" WHERE status = :status AND id = :id', { id, status: UserStatus.APPROVED });
    const user = result.rows[0];
    if (!user)
      return response.status(404).send({}).end();
    const payload = {
      creds: {
        v: 'v1',
        fields: {
          user_id: id,
          email: user.email,
          name: user.fullName,
          avatar_url: user.imagePath,
          bio: user.about,
          profile_url: getPeerboardProfileUrl(request) + id,
        }
      }
    };
    if (id === config.emailService.adminUuid) {
      // @ts-ignore
      payload.creds.fields.role = 'admin';
    }

    const token = jsonwebtoken.sign(payload, getPeerboardAuthToken(request), { expiresIn: '60s' });
    return response.status(200).send({token}).end();
  } catch (e) {
    console.debug('GET /v1/peerboard/auth', e);
    return response.status(500).send({}).end();
  }
});

export { peerboardAuthControler as PeerboardAuthController };
