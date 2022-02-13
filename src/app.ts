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
import {AuthMagicLinkController, authPasswordRouter, RefreshTokenController} from './controllers/authController';
import {EmailMagicLinkSenderController, EmailInviteLinkSenderController, RemoveOldTokensController} from './controllers/emailSenderController';
import {UploadImageController} from './controllers/uploadImageController';
import {FriendEntryController} from './controllers/friendController';
import {LocationsController,PlaceIdResolverController} from './controllers/locationController';
import {SingleContactController, AllContactsController} from './controllers/contactController';
import {GetSkillsController, GetLocationsController} from './controllers/databaseController';
import {PeerboardAuthController} from './controllers/peerboardController';
import {addPermission, delPermission} from './controllers/permissionController';

import { errorHandler, notFoundHandler } from './errorHandler';
import {accessTokenHandler} from './accessTokenHandler';
import requestIdHandler from './requestId';
import cors from 'cors';
import {UserController, UsersController, AddUsersForTest, DelUsersForTest, addFakeUsers, getUsersCount,
  printSomeUsers, addUser, activateUser, banUser, existUsers, userSetPassword, resolveEmail} from './controllers/usersController';
import {InvalidateSearchIndexController, InvalidateSearchIndexForTest, SearchController} from './search';
import { addEvent, delEvent, editEvent, getEvent, getJoinedUsers, joinEvent, unjoinEvent, searchEvents } from './controllers/eventController';
import {amoController} from './controllers/amoController';

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

register(app, '/v1/auth/magicLink', AuthMagicLinkController);
register(app, '/v1/auth/refresh', RefreshTokenController);
register(app, '/v1/email/sendMagicLink', EmailMagicLinkSenderController);
register(app, '/v1/auth/getRefreshTokenByPassword', authPasswordRouter);

register(app, '/v1/amo/webhook', amoController);

if (config.enableMethodsForTest) {
  register(app, '/v1/admin/addUsersForTest', AddUsersForTest, false);
  register(app, '/v1/admin/delUsersForTest', DelUsersForTest, false);
  register(app, '/v1/admin/invalidateSearchIndexForTest', InvalidateSearchIndexForTest, false);
}

// all endpoints closed by authentication below this line

register(app, '/v1/email/sendInviteLink', EmailInviteLinkSenderController, true);

// Profiles end-points
register(app, '/v1/user/friend/:friendId', FriendEntryController, true);
register(app, '/v1/users/:id', UsersController, true);
register(app, '/v1/user/setPassword', userSetPassword, true);
register(app, '/v1/user', UserController, true);
register(app, '/v1/profile/uploadImage', UploadImageController, true);
register(app, '/v1/profile/searchEmail/', ProfileEmailController, true);
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

register(app, '/v1/admin/addUser', addUser, true);
register(app, '/v1/admin/activateUser', activateUser, true);
register(app, '/v1/admin/banUser', banUser, true);
register(app, '/v1/admin/resolveEmail', resolveEmail, true);
register(app, '/v1/admin/existUsers', existUsers, true);
register(app, '/v1/admin/removeOldTokens', RemoveOldTokensController, true);

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
