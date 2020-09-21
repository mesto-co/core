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
import knex from '../knex';
import {getArgs} from '../utils';
import {UserStatus} from '../enums/UserStatus';
import {TokenHelper} from '../TokenHelper';
import {RefreshJwtPayloadModel} from '../models/RefreshJwtPayloadModel';
import jsonwebtoken, {VerifyErrors} from 'jsonwebtoken';

const {
  refreshToken: {
    jwtSecret: refreshJwtSecret,
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

          const payload: RefreshJwtPayloadModel = { userId: id };
          const jwt = TokenHelper.signMagicLinkToken(payload);

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

const refreshTokenRouter = express.Router();
refreshTokenRouter.route('/')
    .post(
        async (request: express.Request, response: express.Response) => {
          const {RqUid, refreshToken} = getArgs(request);

          if (!refreshToken)
            return response.status(401).json({RqUid}).end();

          jsonwebtoken.verify(refreshToken, refreshJwtSecret, {algorithms: ['HS256']}, async (err: VerifyErrors | null, decoded: any) => {
            if (err)
              return response.status(401).json({RqUid}).end();

            try {
              const user = await UserEntries()
                  .join('UserToken', 'User.id', 'UserToken.userId')
                  .where('User.id', decoded!.userId)
                  .andWhere('User.status', UserStatus.APPROVED)
                  .andWhere('UserToken.token', refreshToken)
                  .first('User.id', 'User.fullName', 'User.role');

              if (!user)
                return response.status(401).json({RqUid}).end();

              const newRefreshToken = TokenHelper.signRefreshToken({userId: user.id});
              const [tokenId] = await UserTokenEntries().returning('id').insert({
                token: newRefreshToken,
                userId: user.id
              });

              if (tokenId) {
                await UserTokenEntries().where('token', refreshToken).del();

                const accessToken = TokenHelper.signAccessToken(user);
                return response.status(200).json({RqUid, accessToken, refreshToken: newRefreshToken}).end();
              }

              return response.status(500).json({RqUid}).end();
            } catch (e) {
              console.debug(`${request.url} error`, e);
              return response.status(500).json({RqUid}).end();
            }
          });
        }
    );

export {
  authMagicLinkRouter as AuthMagicLinkController,
  refreshTokenRouter as RefreshTokenController
};
