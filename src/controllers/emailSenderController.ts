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
import {getArgs, getEmail, hasPermission} from '../utils';
import {UserStatus} from '../enums/UserStatus';
import {emailService} from '../emailService';

import {TokenHelper} from '../TokenHelper';
import {RefreshJwtPayloadModel} from '../models/RefreshJwtPayloadModel';
import { Permission } from '../enums/permission';

const {
  magicLink: {
    url: magicLinkUrl
  },
  refreshToken: {
    jwtSecret: refreshJwtSecret,
  },
  emailService: {
    minIntervalInSeconds
  }
} = require('../../config.js');

const UserEntries = () => knex('User');

const UserTokenEntries = () => knex('UserToken');

const emailMagicLinkSenderRouter = express.Router();
emailMagicLinkSenderRouter.route('/')
    .post(async (request, response) => {
      const {tokenId} = getArgs(request);
      const email = getEmail(request);
      try {
        const user = await UserEntries().where('email', email).andWhere('status', UserStatus.APPROVED).first();

        if (user) {
          const {id} = user;
          const userToken = await UserTokenEntries().where('id', tokenId).andWhere('userId', id).first();

          if (userToken) {
            const {rows} = await knex.raw('SELECT 1 FROM user_last_email_sent WHERE user_id = ? AND sent_at > CURRENT_TIMESTAMP - ? * interval \'1 second\'', [id, minIntervalInSeconds]);
            if (rows.length)
              return response.status(429).json({}).end();
            return jsonwebtoken.verify(userToken.token, refreshJwtSecret,{algorithms: ['HS256']}, async (err: VerifyErrors | null) => {
              if (err)
                return response.status(404).json({}).end();

              await knex.raw(`INSERT INTO user_last_email_sent (user_id) VALUES (?)
                ON CONFLICT (user_id) DO UPDATE SET sent_at = CURRENT_TIMESTAMP;`, [id]);

              const magicLink = `${magicLinkUrl}token=${userToken.token}`;
              await emailService.sendMagicLinkEmail(email, magicLink);
              return response.status(200).json({}).end();
            });
          }

          return response.status(404).json({}).end();
        }

        response.status(404).json({}).end();
      } catch (e) {
        console.debug('email/sendMagicLink error', e);
        response.status(500).json({}).end();
      }
    });

const emailInviteLinkSenderRouter = express.Router();
emailInviteLinkSenderRouter.route('/')
    .post(async (request, response) => {
      const {email} = getArgs(request);
      try {
        if (hasPermission(request, Permission.SENDINVITEEMAIL)) {
          const user = await UserEntries().where('email', email).andWhere('status', UserStatus.APPROVED).first();
          if (user) {
            const {id} = user;
            const payload: RefreshJwtPayloadModel = { userId: id };
            const jwt = TokenHelper.signInviteLinkToken(payload);
            await UserTokenEntries().insert({token: jwt, userId: id});
            const magicLink = `${magicLinkUrl}token=${jwt}&redirect=/profile/edit/`;
            await emailService.sendInviteEmail(email, magicLink);
            return response.status(200).json({}).end();
          }
          return response.status(404).json({}).end();
        }
        return response.status(401).json({}).end();
      } catch (e) {
        console.debug('email/sendMagicLink error', e);
        response.status(500).json({}).end();
      }
    });

const removeOldTokens = express.Router();
removeOldTokens.route('/')
    .post(async (request, response) => {
      try {
        if (hasPermission(request, Permission.REMOVEOLDTOKENS)) {
          const {rows}: {rows: [{id: string, token: string}]} = await knex.raw('SELECT id, token FROM "UserToken"LIMIT 500');
          const remove: string[] = [];
          await Promise.allSettled(rows.map(row =>
            new Promise(resolve => {
              jsonwebtoken.verify(row.token, refreshJwtSecret,{algorithms: ['HS256']}, err => {
                if (err)
                  remove.push(row.id);
                resolve();
              });
            })));
          if (remove.length)
            await knex.raw(`DELETE FROM "UserToken" WHERE id IN(${Array(remove.length).fill('?').join(',')})`, remove);

          return response.status(200).json({count: remove.length}).end();
        }
        return response.status(401).json({}).end();
      } catch (e) {
        console.debug('admin/removeOldTokens error', e);
        response.status(500).json({}).end();
      }
    });

export { emailMagicLinkSenderRouter as EmailMagicLinkSenderController, emailInviteLinkSenderRouter as EmailInviteLinkSenderController, removeOldTokens as RemoveOldTokensController };
