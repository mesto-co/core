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
import {UserModel} from './models/UserModel';
import {RefreshJwtPayloadModel} from './models/RefreshJwtPayloadModel';

const {
  magicLink: {
    jwtExpiresIn: magicLinkJwtExpiresIn,
  },
  accessToken: {
    jwtExpiresIn: accessJwtExpiresIn,
    jwtSecret: accessJwtSecret
  },
  refreshToken: {
    jwtExpiresIn: refreshJwtExpiresIn,
    jwtSecret: refreshJwtSecret
  },
  inviteLink: {
    jwtExpiresIn: signJwtExpiresIn
  }
} = require('../config.js');

class TokenHelper {
  static signMagicLinkToken(payload: RefreshJwtPayloadModel, expireIn?: string) {
    return jsonwebtoken.sign(payload, refreshJwtSecret, {expiresIn: expireIn || magicLinkJwtExpiresIn, algorithm: 'HS256'});
  }

  static signInviteLinkToken(payload: RefreshJwtPayloadModel) {
    return jsonwebtoken.sign(payload, refreshJwtSecret, {expiresIn: signJwtExpiresIn, algorithm: 'HS256'});
  }

  static signAccessToken(payload: UserModel) {
    return jsonwebtoken.sign(payload, accessJwtSecret, {expiresIn: accessJwtExpiresIn, algorithm: 'HS256'});
  }

  static signRefreshToken(payload: RefreshJwtPayloadModel) {
    return jsonwebtoken.sign(payload, refreshJwtSecret, {expiresIn: refreshJwtExpiresIn, algorithm: 'HS256'});
  }

  static getTokenFromAuthHeader(request: express.Request): string | null {
    const authScheme = 'Bearer';
    const authHeaderValue = request.headers['authorization'];
    let token = null;
    if (authHeaderValue) {
      const [scheme, value] = authHeaderValue.split(/\s+/);
      if (scheme === authScheme)
        token = value;
    }
    return token;
  }
}

export {TokenHelper};
