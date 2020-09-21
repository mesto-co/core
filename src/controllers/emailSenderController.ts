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
import jsonwebtoken, {VerifyErrors} from 'jsonwebtoken';
import knex from '../knex';
import {getArgs} from '../utils';
import {UserStatus} from '../enums/UserStatus';
import {emailService} from '../emailService';

const {
  magicLink: {
    url: magicLinkUrl
  },
  refreshToken: {
    jwtSecret: refreshJwtSecret,
  }
} = require('../../config.js');

const UserEntries = () => knex('User');

const UserTokenEntries = () => knex('UserToken');

const emailMagicLinkSenderRouter = express.Router();
emailMagicLinkSenderRouter.route('/')
    .post(async (request, response) => {
      const {email, tokenId, RqUid} = getArgs(request);

      try {
        const user = await UserEntries().where('email', email).andWhere('status', UserStatus.APPROVED).first();

        if (user) {
          const {id, fullName} = user;
          const userToken = await UserTokenEntries().where('id', tokenId).andWhere('userId', id).first();

          if (userToken) {
            return jsonwebtoken.verify(userToken.token, refreshJwtSecret,{algorithms: ['HS256']}, async (err: VerifyErrors | null) => {
              if (err)
                return response.status(404).json({RqUid}).end();

              const magicLink = `${magicLinkUrl}?token=${userToken.token}`;
              await emailService.sendMagicLinkEmail(email, fullName, magicLink);
              return response.status(200).json({RqUid}).end();
            });
          }

          return response.status(404).json({RqUid}).end();
        }

        response.status(404).json({RqUid}).end();
      } catch (e) {
        console.debug('email/sendMagicLink error', e);
        response.status(500).json({RqUid}).end();
      }
    });

export { emailMagicLinkSenderRouter as EmailMagicLinkSenderController };
