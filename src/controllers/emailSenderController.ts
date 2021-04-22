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
  }
} = require('../../config.js');
const config = require('../../config.js');

const UserEntries = () => knex('User');

const UserTokenEntries = () => knex('UserToken');

function isValidReferer(referer) {
  if (referer && (referer === 'https://dev.mesto.co/' || referer === 'https://app.mesto.co'))
    return true;
  return false;
}

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
            return jsonwebtoken.verify(userToken.token, refreshJwtSecret,{algorithms: ['HS256']}, async (err: VerifyErrors | null) => {
              if (err)
                return response.status(404).json({}).end();
              const referer = request.headers['referer'];
              const magicLink = isValidReferer(referer) ? `${referer}auth/magic-link/?token=${userToken.token}` : `${magicLinkUrl}token=${userToken.token}`;
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

const emailBetaSenderRouter = express.Router();
emailBetaSenderRouter.route('/')
    .post(async (request, response) => {
      const {email} = getArgs(request);
      const {id: userId} = request.user!;
      if (userId !== config.emailService.adminUuid)
        return response.status(403).json({}).end();
      await emailService.sendBetaEmail(email);
      return response.status(200).json({}).end();
    });
export { emailMagicLinkSenderRouter as EmailMagicLinkSenderController, emailInviteLinkSenderRouter as EmailInviteLinkSenderController, emailBetaSenderRouter as EmailBetaSenderController };
