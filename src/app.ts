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

import validator from './validator';
import {TestController, TestEntryController, TestSuccessRouter} from './controllers/testController';
import {ProfileController, ProfileEmailController} from './controllers/profileController';
import {AuthMagicLinkController, authPasswordRouter, RefreshTokenController, CheckTelegramSecretController} from './controllers/authController';
import {EmailMagicLinkSenderController, EmailTelegramLinkSenderController, getMagicUrl, RemoveOldTokensController} from './controllers/emailSenderController';
import {UploadImageController} from './controllers/uploadImageController';
import {FriendEntryController} from './controllers/friendController';
import {LocationsController,PlaceIdResolverController} from './controllers/locationController';
import {SingleContactController, AllContactsController} from './controllers/contactController';
import {GetSkillsController, GetLocationsController} from './controllers/databaseController';
import {PeerboardAuthController} from './controllers/peerboardController';
import {addPermission, delPermission} from './controllers/permissionController';

import { errorHandler, notFoundHandler } from './errorHandler';
import {accessTokenHandler, verifyAccessToken} from './accessTokenHandler';
import requestIdHandler from './requestId';
import cors from 'cors';
import {UserController, UsersController, AddUsersForTest, DelUsersForTest, addFakeUsers, getUsersCount,
  printSomeUsers, banUser, userSetPassword, resolveEmail} from './controllers/usersController';
import {InvalidateSearchIndexController, InvalidateSearchIndexForTest, SearchController} from './search';
import { addEvent, delEvent, editEvent, getEvent, getJoinedUsers, joinEvent, unjoinEvent, searchEvents } from './controllers/eventController';
import { tildaRouter } from './controllers/tildaController';
import { getArgs, hasPermission } from './utils';
import {Permission} from './enums/permission';
import knex from './knex';

import https from 'https';
import path from 'path';

const config = require('../config.js');

const app = express();

app.use(cors({origin: config.corsOrigin}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(requestIdHandler);
app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// all API endpoints are listed below this line.
function register(app: express.Express, endpoint: string, router: express.Router, authRequired?: boolean) {
  app.use(endpoint, authRequired ? [accessTokenHandler, validator(endpoint)] : validator(endpoint), router);
}

register(app, '/v1/test/:id', TestEntryController);
register(app, '/v1/test/', TestController);
register(app, '/test/success', TestSuccessRouter);

const snakeToCamel = (str: string) =>
  str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
        .toUpperCase()
        .replace('-', '')
        .replace('_', '')
  );

const SIGNUPDATA_COLUMNS = [
  'user_id', 'name', 'email', 'birthdate', 'birthdate_precision', 'country', 'social_media_link',
  'telegram', 'heard_about_us', 'about_me', 'profession', 'profession_details', 'groups',
  'project_type', 'project_details', 'can_help', 'looking_for',
];
// Signup data
app.post('/v1/signupData', validator('/v1/signupData'), async (request, response) => {
  try {
    const user = await verifyAccessToken(request);
    const args = getArgs(request);
    if (user) {
      request.user = user;
      if (!hasPermission(request, Permission.ADDSIGNUPDATA))
        return response.status(401).end();
    } else {
      const hCaptchaResponse = args['h-captcha-response'];
      const verified = await new Promise((resolve, reject) => {
        const request = https.request('https://hcaptcha.com/siteverify', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        }, response => {
          response.once('error', reject);
          let data = '';
          response.on('data', d => data += d);
          response.once('end', () => {
            try {
              const {success} = JSON.parse(data);
              resolve(success ?? false);
            } catch (e) {
              reject(e);
            }
          });
        });
        request.once('error', reject);
        request.end(`response=${hCaptchaResponse}&secret=${config.hCaptchaSecret}`);
      });
      if (!verified)
        return response.status(401).end();
    }

    const columns = SIGNUPDATA_COLUMNS;
    const EMPTY = Object.fromEntries(columns.map(column => [snakeToCamel(column), null]));
    if (!args.userId) {
      // We should try to lookup for user by email.
      const {rows} = await knex.raw('SELECT id FROM "User" WHERE email = :email', {email: args.email});
      if (rows && rows.length)
        args.userId = rows[0].id;
    }
    if (!args.userId) {
      // At this point we know that there is no userId passed as argument and there is no user with given email,
      // so we create user outselves.
      const {rows} = await knex.raw('INSERT INTO "User" ("fullName", email, about, status) VALUES (:name, :email, :about, :status) RETURNING id', {
        name: args.name,
        email: args.email,
        about: args.aboutMe || null,
        status: 'awaiting',
      });
      args.userId = rows[0].id;
    }
    if (!args.userId) {
      return response.status(500).json({
        message: 'We tried our best to detect userId but something when wrong',
      });
    }
    // When we pass userId - we are adding signupData for existing user.
    const {rows} = await knex.raw('SELECT EXISTS(SELECT 1 FROM signup_data WHERE user_id = ?)', [args.userId]);
    if (rows.length && rows[0].exists)
      return response.status(400).json({message: 'Given user has signupData, please use /v1/signupData/:id to update it'}).end();
    const {rows: userRows} = await knex.raw(`SELECT email, "fullName", about FROM "User" WHERE id = :userId`, {userId: args.userId});
    if (!userRows.length)
      return response.status(404).json({message: 'There is no user with given userId'});
    const {email, fullName, about} = userRows[0];
    if (email !== args.email)
      return response.status(400).json({message: 'User with given userId has different email'});
    // We always prefer existing fullName and about from the user if any.
    args.name = fullName;
    if (about)
      args.aboutMe = about;
    await knex.raw(`
      INSERT INTO signup_data
        (${columns.join(',')})
      VALUES
        (${columns.map(column => `:${snakeToCamel(column)}`).join(',')})
      `, {...EMPTY, ...args});
    return response.status(200).json({userId: args.userId}).end();
  } catch (e) {
    console.debug('POST /v1/signupData', e);
    return response.status(500).end();
  }
});

app.get('/v1/signupData/:userId', accessTokenHandler, validator('/v1/signupData/:userId'), async (request, response) => {
  try {
    const args = getArgs(request);
    if (hasPermission(request, Permission.GETSIGNUPDATA) || request.user?.id === args.userId) {
      const columns = SIGNUPDATA_COLUMNS.filter(column => column !== 'email');
      const {rows} = await knex.raw(`SELECT ${columns.join(',')} FROM signup_data WHERE user_id = :userId`, {
        userId: args.userId,
      });
      if (rows && rows.length) {
        const result = Object.fromEntries(
            columns
                .map(column => [snakeToCamel(column), rows[0][column]])
                .filter(entry => entry[1] !== null)
        );
        return response.status(200).json(result).end();
      }
      return response.status(404).json({message: 'There is no signupData for given userId'}).end();
    } else {
      return response.status(401).end();
    }
  } catch (e) {
    console.debug('GET /v1/signupData/:userId', e);
    return response.status(500).end();
  }
});

app.post('/v1/signupData/:userId', accessTokenHandler, validator('/v1/signupData/:userId'), async (request, response) => {
  try {
    const args = getArgs(request);
    if (hasPermission(request, Permission.GETSIGNUPDATA) || request.user?.id === args.userId) {
      const {rows} = await knex.raw(`SELECT EXISTS(SELECT 1 FROM signup_data WHERE user_id = :userId)`, {
        userId: args.userId,
      });
      if (rows && rows[0].exists) {
        const columns = SIGNUPDATA_COLUMNS
            .filter(column => column !== 'email' && column !== 'user_id')
            .filter(column => !!args[snakeToCamel(column)]);
        const EMPTY = Object.fromEntries(columns.map(column => [snakeToCamel(column), null]));
        if (columns.length) {
          await knex.raw(`UPDATE signup_data SET ${columns
              .map(column => `${column} = :${snakeToCamel(column)}`)
              .join(',')}
            WHERE user_id = :userId`, {...EMPTY, ...args});
        }
        return response.status(200).json({userId: args.userId}).end();
      }
      return response.status(404).json({message: 'There is no signupData for given userId'}).end();
    } else {
      return response.status(401).end();
    }
  } catch (e) {
    console.debug('POST /v1/signupData/:userId', e);
    return response.status(500).end();
  }
});

register(app, '/v1/auth/magicLink', AuthMagicLinkController);
register(app, '/v1/auth/refresh', RefreshTokenController);
register(app, '/v1/email/sendMagicLink', EmailMagicLinkSenderController);
register(app, '/v1/auth/getRefreshTokenByPassword', authPasswordRouter);
app.post('/v1/auth/retrieveMagicLink', accessTokenHandler, validator('/v1/auth/retrieveMagicLink'), async (request, response) => {
  if (hasPermission(request, Permission.RETRIEVEMAGICLINK)) {
    const {tokenId} = getArgs(request);
    const {rows: [entry]} = await knex.raw(`SELECT token FROM "UserToken" WHERE id = :tokenId`, {tokenId});
    if (entry)
      return response.status(200).json({url: `${getMagicUrl(request)}token=${entry.token}`}).end();
    return response.status(404).end();
  }
  return response.status(401).end();
});

if (config.enableMethodsForTest) {
  register(app, '/v1/admin/addUsersForTest', AddUsersForTest, false);
  register(app, '/v1/admin/delUsersForTest', DelUsersForTest, false);
  register(app, '/v1/admin/invalidateSearchIndexForTest', InvalidateSearchIndexForTest, false);
}

// This route accepts whatever tilda passes our way and stores it in a table so amoSync can use it later,
// so we do not need to validate it.
app.use('/v1/tilda/signup', tildaRouter);

// All endpoints closed by authentication below this line
register(app, '/v1/email/sendTelegramLink', EmailTelegramLinkSenderController, true);
register(app, '/v1/auth/checkTelegramSecret', CheckTelegramSecretController, true);

// Profiles end-points
register(app, '/v1/user/friend/:friendId', FriendEntryController, true);
register(app, '/v1/users/:id', UsersController, true);
register(app, '/v1/user/setPassword', userSetPassword, true);
register(app, '/v1/user', UserController, true);
register(app, '/v1/profile/uploadImage', UploadImageController, true);
register(app, '/v1/profile/searchByEmail/', ProfileEmailController, true);
register(app, '/v1/profile/search/', ProfileController, true);
register(app, '/v1/search', SearchController, true);
register(app, '/v1/location/', LocationsController, true);
register(app, '/v1/resolvePlaceId', PlaceIdResolverController, true);
register(app, '/v1/contact/:contactId', SingleContactController, true);
register(app, '/v1/contact', AllContactsController, true);
register(app, '/v1/peerboard/auth', PeerboardAuthController, true);
register(app, '/v1/addPermission', addPermission, true);
register(app, '/v1/delPermission', delPermission, true);

register(app, '/v1/event/addEvent', addEvent, true);
register(app, '/v1/event/getEvent', getEvent, true);
register(app, '/v1/event/getJoinedUsers', getJoinedUsers, true);
register(app, '/v1/event/editEvent', editEvent, true);
register(app, '/v1/event/delEvent', delEvent, true);
register(app, '/v1/event/joinEvent', joinEvent, true);
register(app, '/v1/event/unjoinEvent', unjoinEvent, true);
register(app, '/v1/event/search', searchEvents, true);

register(app, '/v1/admin/banUser', banUser, true);
register(app, '/v1/admin/resolveEmail', resolveEmail, true);
register(app, '/v1/admin/removeOldTokens', RemoveOldTokensController, true);
app.post('/v1/admin/migrate/latest', accessTokenHandler, async (request, response) => {
  if (hasPermission(request, Permission.MIGRATE)) {
    try {
      await knex.migrate.latest({directory: path.join(__dirname, '..', 'migrations')});
      return response.json({version: await knex.migrate.currentVersion()}).status(200).end();
    } catch (e) {
      console.debug('/v1/admin/migrate/latest', e);
      return response.status(500).end();
    }
  }
  return response.status(401).end();
});

register(app, '/v1/database/getSkills', GetSkillsController, true);
register(app, '/v1/database/getLocations', GetLocationsController, true);

// endpoints below are available only for admin account
register(app, '/v1/admin/invalidateSearchIndex', InvalidateSearchIndexController, true);

// two handlers below should be last handlers and their order matters.
app.use(notFoundHandler);
app.use(errorHandler);
// do not add any handlers below this line, notFound one should be last!

if ((!process.env.NODE_ENV || process.env.NODE_ENV === 'development') && addFakeUsers && getUsersCount && printSomeUsers)
  getUsersCount().then(count => (count < 100 && addFakeUsers) ? addFakeUsers(Array(100 - count).fill({})) : void 0).then(() => printSomeUsers && printSomeUsers());

export default app;
