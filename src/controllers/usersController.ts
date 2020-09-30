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
import Knex from 'knex';
import { UserStatus } from '../enums/UserStatus';
import knex from '../knex';

import {getArgs} from '../utils';

const UserEntries = () => knex('User');
const ContactEntries = () => knex('Contact');
const FriendEntries = () => knex('Friend');

const handleUserRequestById = async (id: string, selfInfo: boolean, request: any, response: any) => {
  const {RqUid} = getArgs(request);

  try {
    const contactsPromise = ContactEntries()
        .select([
          'title',
          'url'
        ])
        .where('ownerId', id);
    const userPromise = UserEntries()
        .select([
          'id',
          'fullName',
          'username',
          selfInfo ? 'email' : null,
          'imagePath',
          'location',
          'about',
          'role',
          'skills',
          'status'
        ].filter(t => !!t))
        .first()
        .where((builder: Knex.QueryBuilder) => {
          // if (!selfInfo)
          builder.where('status', UserStatus.APPROVED);

          builder.where('id', id);
        });

    const isFriendPromise = selfInfo ? null :
      await FriendEntries()
          .select('id')
          .first()
          .where('userId', request.user!.id!)
          .andWhere('friendId', id);

    const [contacts, user, isFriend] = await Promise.allSettled([contactsPromise, userPromise, isFriendPromise].filter(t => t));

    if (!user)
      return response.status(404).json({RqUid}).end();

    const result = {
      isFriend: !!isFriend,
      contacts,
      ...user
    };

    response.status(200).json({RqUid, user: result}).end();
  } catch (e) {
    console.debug('handleUserRequestById error', e);
    response.status(500).json({RqUid}).end();
  }
};

const usersController = express.Router();
usersController.route('/')
    .get(async (request, response) => {
      const {id} = getArgs(request);
      await handleUserRequestById((id as string), false, request, response);
    });

const userController = express.Router();
userController.route('/')
    .get(async (request, response) => {
      await handleUserRequestById(request.user!.id!, true, request, response);
    });

export {
  userController as UserController,
  usersController as UsersController
};
