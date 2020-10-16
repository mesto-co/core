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
import { UserStatus } from '../enums/UserStatus';
import knex from '../knex';
import {invalidateSearchIndex} from '../search';

import {getArgs} from '../utils';

interface Contact {
  title: string;
  url: string;
}

interface User {
  id: string;
  fullName: string;
  username: string|null|undefined;
  email: string|undefined;
  imagePath: string|null|undefined;
  location: string|null|undefined;
  placeId: string|null|undefined;
  about: string|null|undefined;
  role: string|null|undefined;
  skills: string[];
  status: string;
  busy: boolean;
}

const handleUserRequestById = async (id: string, selfInfo: boolean, request: any, response: any) => {
  try {
    const contactsPromise = knex.raw(`SELECT title, url FROM "Contact" WHERE "ownerId" = ?`, [id])
        .then((result: {rows: Contact[]}) => result.rows);

    const userPromise = knex.raw(`
      SELECT id, "fullName", username, ${selfInfo ? 'email,' : ''} "imagePath", location, place_id as "placeId", about, role, skills, status, busy
      FROM "User" WHERE status = ? AND id = ? LIMIT 1`, [UserStatus.APPROVED, id])
        .then((result: {rows: User[]}) => result.rows.length > 0 ? removeNulls(result.rows[0]) : null);

    const isFriendPromise = selfInfo ? false : knex.raw(`SELECT EXISTS(SELECT 1 FROM "Friend" WHERE "userId" = ? AND "friendId" = ?)`, [request.user!.id!, id])
        .then((result: {rows: {exists: boolean}[]}) => result.rows.length > 0 ? result.rows[0].exists : false);
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

  function removeNulls(user: User) {
    if (user.username === null)
      delete user.username;
    if (user.imagePath === null)
      delete user.imagePath;
    if (user.location === null)
      delete user.location;
    if (user.placeId === null)
      delete user.placeId;
    if (user.about === null)
      delete user.about;
    if (user.role === null)
      delete user.role;
    return user;
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
      const { location, role = null, about, fullName, skills = null, imagePath = null, busy = false, placeId = null } = getArgs(request);
      if (request.user) {
        try {
          const id = request.user.id;
          await knex.raw(`
            UPDATE "User" SET about = :about, location = :location, place_id = :placeId, role = :role, "fullName" = :fullName,
            skills = :skills, "imagePath" = :imagePath, busy = :busy WHERE id = :id`,
          { about, location, placeId, role, fullName, skills, imagePath, busy, id });
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
