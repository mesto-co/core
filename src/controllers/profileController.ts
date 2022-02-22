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

import {getArgs, hasPermission} from '../utils';
import {performSearch, performSearchEmail} from '../search';
import {Permission} from '../enums/permission';

interface SearchQuery {
  fullName: string | undefined,
  location: string | undefined,
  about: string | undefined,
  skills: string | undefined
}

const searchRouter = express.Router();
searchRouter.route('/')
    .post(async (request, response) => {
      const {query, currentPage, perPage, onlyFriends}: {query: SearchQuery[], currentPage: number, perPage: number, onlyFriends: boolean} = getArgs(request);
      const {id: userId} = request.user!;
      try {
        // TODO(ak239): introduce a new search method that will take a string.
        let words = query.map(obj => [obj.fullName, obj.location, obj.about, obj.skills].filter(v => !!v)).flat();
        const lastWord = words[words.length - 1];
        words = Array.from(new Set(words));
        if (lastWord && words[words.length - 1] !== lastWord)
          words.push(lastWord);
        const entries = await performSearch(
            words.join(' '),
            perPage,
            perPage * (currentPage - 1),
            userId,
            onlyFriends);
        response.status(200).json({entries}).end();
      } catch (e) {
        console.debug('POST profile/search error', e);
        response.status(500).json({}).end();
      }
    });

const searchByEmailRouter = express.Router();
searchByEmailRouter.route('/')
    .post(async (request, response) => {
      if (hasPermission(request, Permission.SEARCHBYEMAIL)) {
        const {email}: { email: string } = getArgs(request);
        try {
          const user = await performSearchEmail(email);
          response.status(200).json({user}).end();
        } catch (e) {
          console.debug('POST profile/search error', e);
          response.status(500).json({}).end();
        }
      } else {
        response.status(401).json({}).end();
      }
    });

export {
  searchRouter as ProfileController,
  searchByEmailRouter as ProfileEmailController
};
