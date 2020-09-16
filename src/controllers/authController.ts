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
import knex from '../knex';
import {getArgs} from '../utils';
import {UserStatus} from '../enums/UserStatus';

const {
  magicLink: {
    jwtExpiresIn: magicLinkJwtExpiresIn,
    jwtSecret: magicLinkJwtSecret,
  }
} = require('../../config.js');

const UserEntries = () => knex('User');

const UserTokenEntries = () => knex('UserToken');

const authMagicLinkRouter = express.Router();
authMagicLinkRouter.route('/')
    .post(async (request, response) => {
      const {email, RqUid} = getArgs(request);
      try {
        const user = await UserEntries().where('email', email).andWhere('status', UserStatus.APPROVED).first();
        if (user) {
          const {id} = user;

          await UserTokenEntries().where('userId', id).del();
          const jwt = jsonwebtoken.sign({id}, magicLinkJwtSecret, {expiresIn: magicLinkJwtExpiresIn});

          const [tokenId] = await UserTokenEntries().returning('id').insert({token: jwt, userId: id});

          if (tokenId)
            return response.status(200).json({RqUid, tokenId}).end();

          return response.status(500).json({RqUid}).end();
        }

        response.status(404).json({RqUid}).end();
      } catch (e) {
        console.debug('auth/magicLink error', e);
        response.status(500).json({RqUid}).end();
      }
    });

export { authMagicLinkRouter as AuthMagicLinkController };
