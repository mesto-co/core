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
const {enableMethodsForTest} = require('../../config.js');

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
      const { location = null, role = null, about, fullName, skills = null, imagePath = null, busy = false, placeId = null } = getArgs(request);
      if (request.user) {
        try {
          const id = request.user.id;
          await knex.raw(`
            UPDATE "User" SET about = :about, location = :location, place_id = :placeId, role = :role, "fullName" = :fullName,
            skills = :skills, skills_lo = :skills_lo, "imagePath" = :imagePath, busy = :busy WHERE id = :id`,
          { about, location, placeId, role, fullName, skills, skills_lo: skills.map((v: string) => v.toLowerCase()), imagePath, busy, id });
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

const addUsersForTest = express.Router();
const delUsersForTest = express.Router();

interface TestUser {
  id: string | undefined;
  fullName: string | undefined;
  username: string | undefined;
  email: string | undefined;
  passwordHash: string | undefined;
  imagePath: string | undefined;
  location: string | undefined;
  place_id: string | undefined;
  phone: string | undefined;
  about: string | undefined;
  role: string | undefined;
  busy: boolean | undefined;
  status: string | undefined;
  skills: string[] | undefined;
  skills_lo: string[] | undefined;
}
let addFakeUsers: ((user: TestUser[]) => Promise<TestUser[]>)|null = null;
let getUsersCount: (() => Promise<number>)|null = null;

if (enableMethodsForTest) {
  const faker = require('faker');
  faker.locale = 'ru';
  faker.seed(1);

  addFakeUsers = async function(users: TestUser[]) {
    const genUser = (override: TestUser): TestUser => {
      const skills = faker.random.words().split(' ');
      if (override.skills)
        override.skills_lo = override.skills.map(v => v.toLowerCase());
      return Object.assign({
        id: faker.random.uuid(),
        fullName: faker.name.firstName() + ' ' + faker.name.lastName(),
        username: faker.internet.userName(),
        email: faker.internet.email().toLowerCase(),
        passwordHash: null,
        imagePath: faker.image.imageUrl(),
        location: faker.address.city(),
        place_id: faker.random.uuid(),
        phone: faker.phone.phoneNumber(),
        about: faker.lorem.paragraphs().substr(0, 6000),
        role: faker.random.word(),
        busy: faker.random.boolean(),
        status: 'approved',
        skills: skills,
        skills_lo: skills.map((v: string) => v.toLowerCase())
      }, override);
    };
    const newUsers = users.map(genUser);
    const columns = Object.keys(newUsers[0]);
    await knex.raw(`INSERT INTO "User"(${Array(columns.length).fill('??').join(',')}) VALUES ${Array(newUsers.length).fill('(' + (Array(columns.length).fill('?').join(',') + ')')).join(',')} ON CONFLICT DO NOTHING`,
        [...columns, ...newUsers.map(user => Object.values(user)).flat()]);
    await Promise.allSettled(newUsers.map(user => (user.id ? invalidateSearchIndex(user.id) : void 0)));
    return newUsers;
  };

  getUsersCount = function() {
    return knex.raw('SELECT COUNT(*) as total FROM "User"').then((result: {rows: {total: string}[]}) => result.rows.length ? parseInt(result.rows[0].total, 10) : 0);
  };

  addUsersForTest.route('/')
      .post(async (request, response) => {
        const {users, seed}: {users: TestUser[], seed: number} = getArgs(request);
        faker.seed(seed);
        if (addFakeUsers)
          response.status(200).json(await addFakeUsers(users)).end();
        else
          response.status(500).json({}).end();
      });

  delUsersForTest.route('/')
      .post(async (request, response) => {
        const {userIds}: {userIds: string[]} = getArgs(request);
        // TODO(ak239): ON DELETE CASCADE
        await knex.raw(`DELETE FROM search_word_user WHERE user_id IN (${Array(userIds.length).fill('?').join(',')})`, userIds);
        await knex.raw(`DELETE FROM "Friend" WHERE "userId" IN (${Array(userIds.length).fill('?').join(',')}) OR "friendId" IN (${Array(userIds.length).fill('?').join(',')})`, [...userIds, ...userIds]);
        await knex.raw(`DELETE FROM "UserToken" WHERE "userId" IN (${Array(userIds.length).fill('?').join(',')})`, userIds);
        await knex.raw(`DELETE FROM "Contact" WHERE "ownerId" IN (${Array(userIds.length).fill('?').join(',')})`, userIds);
        await knex.raw(`DELETE FROM "User" WHERE id IN (${Array(userIds.length).fill('?').join(',')})`, userIds);
        response.status(200).json({}).end();
      });
}

export {
  userController as UserController,
  usersController as UsersController,
  addUsersForTest as AddUsersForTest,
  delUsersForTest as DelUsersForTest,
  addFakeUsers,
  getUsersCount
};
