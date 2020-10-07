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

const UserEntries = () => knex('User');
const FriendEntries = () => knex('Friend');

const friendEntryRouter = express.Router();
friendEntryRouter.route('/')
    .post(async (request, response) => {
      const {friendId} = getArgs(request);
      const {id: userId} = request.user!;

      if (friendId === userId)
        return response.status(400).json({message: 'You cannot add yourself as a friend'}).end();

      try {
        const friend = await UserEntries().where('id', friendId).first('status');

        if (!friend || friend.status !== UserStatus.APPROVED)
          return response.status(404).json({}).end();

        const [id] = await FriendEntries().returning('id').insert({friendId, userId});

        if (id)
          return response.status(201).json({}).end();

        return response.status(500).json({}).end();
      } catch (e) {
        console.debug('POST user/friend/:friendId error', e);

        if (e.code === '23505')
          return response.status(209).json({}).end();

        response.status(500).json({}).end();
      }
    })
    .delete(async (request, response) => {
      const {friendId} = getArgs(request);
      const {id: userId} = request.user!;
      try {
        const count = await FriendEntries().where('userId', userId).andWhere('friendId', friendId).del();

        if (count)
          return response.status(200).json({}).end();

        return response.status(209).json({}).end();
      } catch (e) {
        console.debug('DELETE user/friend/:friendId error', e);
        response.status(500).json({}).end();
      }
    });

export {
  friendEntryRouter as FriendEntryController,
};
