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

import {getArgs} from './utils';
import {TokenHelper} from './TokenHelper';
import jsonwebtoken, {VerifyErrors} from 'jsonwebtoken';
import { UserModel } from './models/UserModel';

const {
  accessToken: {
    jwtSecret: accessJwtSecret,
  }
} = require('../config.js');

async function verifyAccessToken(request: express.Request): Promise<UserModel|null> {
  const token = TokenHelper.getTokenFromAuthHeader(request);
  if (!token)
    return null;
  return new Promise(resolve => jsonwebtoken.verify(token, accessJwtSecret, {algorithms: ['HS256']}, async (err: VerifyErrors | null, decoded: any) => {
    if (err)
      resolve(null);
    else
      resolve(decoded);
  }));
}

async function accessTokenHandler(request: express.Request, response: express.Response, next: express.NextFunction) {
  const {RqUid} = getArgs(request);
  const user = await verifyAccessToken(request);
  if (user) {
    request.user = user;
    next();
  } else {
    return response.status(401).json({RqUid}).end();
  }
}

export { accessTokenHandler, verifyAccessToken };
