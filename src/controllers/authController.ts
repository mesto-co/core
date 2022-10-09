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
import {getArgs, getEmail, hasPermission} from '../utils';
import {UserStatus} from '../enums/UserStatus';
import {TokenHelper} from '../TokenHelper';
import {RefreshJwtPayloadModel} from '../models/RefreshJwtPayloadModel';
import jsonwebtoken, {VerifyErrors} from 'jsonwebtoken';
import {checkPassword} from '../password';
import { Permission } from '../enums/permission';
import { verifyAccessToken } from '../accessTokenHandler';

const {
  refreshToken: {
    jwtSecret: refreshJwtSecret,
  },
  salt
} = require('../../config.js');

const authMagicLinkRouter = express.Router();
authMagicLinkRouter.route('/')
    .post(async (request, response) => {
      const email = getEmail(request);
      const {expireIn} = getArgs(request);
      if (expireIn) {
        const user = await verifyAccessToken(request);
        if (!user || !user.permissions || !user.permissions.includes(Permission.CUSTOMMAGICLINKEXPIREIN))
          return response.status(401).end();
      }
      try {
        const {rows: [user]} = await knex.raw('SELECT id FROM "User" WHERE email = ? AND status = ? LIMIT 1', [email, UserStatus.APPROVED]);
        if (user) {
          const payload: RefreshJwtPayloadModel = { userId: user.id };
          const jwt = TokenHelper.signMagicLinkToken(payload, expireIn);
          const {rows: [{id: tokenId}]} = await knex.raw(`INSERT INTO "UserToken"(token, "userId") VALUES(?, ?) RETURNING id;`, [jwt, user.id]);
          if (tokenId)
            return response.status(200).json({tokenId}).end();
          return response.status(500).json({}).end();
        }

        response.status(404).json({}).end();
      } catch (e) {
        console.debug('auth/magicLink error', e);
        response.status(500).json({}).end();
      }
    });

const refreshTokenRouter = express.Router();
refreshTokenRouter.route('/')
    .post(
        async (request: express.Request, response: express.Response) => {
          const {refreshToken} = getArgs(request);

          if (!refreshToken)
            return response.status(401).json({}).end();

          jsonwebtoken.verify(refreshToken, refreshJwtSecret, {algorithms: ['HS256']}, async (err: VerifyErrors | null, decoded: any) => {
            if (err)
              return response.status(401).json({}).end();

            try {
              const {rows: [user]} = await knex.raw(`
                SELECT
                  u.id, u."fullName",
                  ARRAY(SELECT permission_id FROM user_permission up WHERE u.id = up.user_id) as permissions
                FROM "User" u, "UserToken" ut
                WHERE u.id = ut."userId" AND u.id = ? AND u.status = ? AND ut.token = ?
                LIMIT 1`, [decoded!.userId, UserStatus.APPROVED, refreshToken]);

              if (!user)
                return response.status(401).json({}).end();

              const newRefreshToken = TokenHelper.signRefreshToken({userId: user.id});
              const {rows: [{id: tokenId}]} = await knex.raw(`INSERT INTO "UserToken"(token, "userId") VALUES(?, ?) RETURNING id;`, [newRefreshToken, user.id]);
              if (tokenId) {
                await knex.raw('DELETE FROM "UserToken" WHERE token = ?', [refreshToken]);

                const accessToken = TokenHelper.signAccessToken(user);
                return response.status(200).json({accessToken, refreshToken: newRefreshToken}).end();
              }

              return response.status(500).json({}).end();
            } catch (e) {
              console.debug(`${request.url} error`, e);
              return response.status(500).json({}).end();
            }
          });
        }
    );

const authPasswordRouter = express.Router();
authPasswordRouter.route('/')
    .post(
        async (request: express.Request, response: express.Response) => {
          const email = getEmail(request);
          const {password} = getArgs(request);
          try {
            const {rows: [user]} = await knex.raw(`
              SELECT
                u.id, u."passwordHash",
                ARRAY(SELECT permission_id FROM user_permission up WHERE u.id = up.user_id) as permissions
              FROM "User" u
              WHERE u.email = ? AND u.status = ?
              LIMIT 1`, [email, UserStatus.APPROVED]);
            if (user && user.passwordHash && await checkPassword(password, salt, user.passwordHash)) {
              const newRefreshToken = TokenHelper.signRefreshToken({userId: user.id});
              const {rows: [{id: tokenId}]} = await knex.raw(`INSERT INTO "UserToken"(token, "userId") VALUES(?, ?) RETURNING id;`, [newRefreshToken, user.id]);
              if (tokenId) {
                delete user.passwordHash;
                const accessToken = TokenHelper.signAccessToken(user);
                return response.status(200).json({accessToken, refreshToken: newRefreshToken}).end();
              }
            }
            return response.status(404).json({}).end();
          } catch (e) {
            console.debug('auth/password error', e);
            response.status(500).json({}).end();
          }
        }
    );

const checkTelegramSecretRouter = express.Router();
checkTelegramSecretRouter.route('/')
    .post(async (request, response) => {
      const email = getEmail(request);
      const {secret} = getArgs(request);
      try {
        if (hasPermission(request, Permission.SENDTELEGRAMLINK)) {
          const isValidSecret = await knex.raw(`SELECT EXISTS(SELECT 1 FROM telegram_secret ts INNER JOIN "User" u ON u.id = ts.user_id WHERE u.email = ? AND ts.secret = ?)`, [email, secret])
              .then((result: {rows: {exists: boolean}[]}) => result.rows.length > 0 ? result.rows[0].exists : false);
          if (!isValidSecret)
            return response.status(404).json({}).end();
          await knex.raw(`DELETE FROM telegram_secret ts USING "User" u WHERE u.id = ts.user_id AND u.email = ? AND ts.secret = ?`, [email, secret]);
          return response.status(200).json({}).end();
        }
        return response.status(401).json({}).end();
      } catch (e) {
        console.debug('email/checkTelegramSecretRouter error', e);
        response.status(500).json({}).end();
      }
    });

export {
  authMagicLinkRouter as AuthMagicLinkController,
  refreshTokenRouter as RefreshTokenController,
  authPasswordRouter,
  checkTelegramSecretRouter as CheckTelegramSecretController
};
