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
/**
 * @typedef {Object} UserEntries
 * @property {string} location
 * @property {string} userName
 * @property {string} role
 * @property {string} about
 * @property {string} fullName
 * @property {Array} skills
 *
 * @returns {Knex.QueryBuilder<UserTable, {}>}
 */
import express from 'express';
import Knex from 'knex';
import { UserStatus } from '../enums/UserStatus';
import knex from '../knex';
import {invalidateSearchIndex} from '../search';

import {getArgs} from '../utils';

const UserEntries = () => knex('User');
const ContactEntries = () => knex('Contact');
const FriendEntries = () => knex('Friend');

const handleUserRequestById = async (id: string, selfInfo: boolean, request: any, response: any) => {
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

    const [contacts, user, isFriend] = (await Promise.allSettled([contactsPromise, userPromise, isFriendPromise])).map(result => result.status === 'fulfilled' ? result.value : null);

    if (!user)
      return response.status(404).json({}).end();
    if (!contacts)
      return response.status(500).json({}).end();

    const result = {
      isFriend: !!isFriend,
      contacts: contacts,
      ...user
    };

    response.status(200).json({user: result}).end();
  } catch (e) {
    console.debug('handleUserRequestById error', e);
    response.status(500).json({}).end();
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
    })
    .put(async (request, response) => {
      const { location, role = null, about, fullName, skills = null, imagePath } = getArgs(request);
      if (request.user) {
        try {
          const id = request.user.id;
          await UserEntries().where('id', id).update({
            about: about,
            location: location,
            role: role,
            fullName: fullName,
            skills: skills,
            imagePath: imagePath
          });
          await invalidateSearchIndex(id);
          response.status(200).json({}).end();
        } catch (error) {
          console.log(error);
          response.status(500).json({}).end();
        }
      } else {
        response.status(401).json({}).end();
      }
    });

export {
  userController as UserController,
  usersController as UsersController
};