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
import {TestController, TestEntryController} from './controllers/testController';
import {ProfileController} from './controllers/profileController';

import { errorHandler, notFoundHandler } from './errorHandler';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// all API endpoints are listed below this line.
function register(app: express.Express, endpoint: string, router: express.Router) {
  app.use(endpoint, validator(endpoint), router);
}

register(app, '/v1/test/:id', TestEntryController);
register(app, '/v1/test/', TestController);

// Profiles end-points
register(app, '/v1/profile/search/', ProfileController);

// two handlers below should be last handlers and their order matters.
app.use(notFoundHandler);
app.use(errorHandler);
// do not add any handlers below this line, notFound one should be last!

export default app;
