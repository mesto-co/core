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

const Contact = () => knex('Contact');

interface ContactValue {
    id: string,
    title: string,
    url: string
}

const singleContactRouter = express.Router();
singleContactRouter.route('/')
    .put(async (request, response) => {
      const {RqUid, contactId, title, url} = getArgs(request);
      const {id: currentUserId} = request.user!;
      try {
        const count = await Contact().where('ownerId', currentUserId).andWhere('id', contactId).update({title, url}).count();
        if (count > 0)
          return response.status(200).json({RqUid}).end();
        else
          return response.status(404).json({RqUid}).end();
      } catch (e) {
        const UNIQUE_VIOLATION_CODE = '23505';
        if (e.code === UNIQUE_VIOLATION_CODE)
          return response.status(422).json({RqUid}).end();
        console.debug('PUT contact/:id', e);
        response.status(500).json({RqUid}).end();
      }
    })
    .delete(async (request, response) => {
      const {RqUid, contactId} = getArgs(request);
      const {id: currentUserId} = request.user!;
      try {
        await Contact().where('id', contactId).andWhere('ownerId', currentUserId).del();
        return response.status(200).json({RqUid}).end();
      } catch (e) {
        console.debug('DELETE contact/:id', e);
        response.status(500).json({RqUid}).end();
      }
    });

const allContactsRouter = express.Router();
allContactsRouter.route('/')
    .get(async (request, response) => {
      const {RqUid} = getArgs(request);
      const {id: currentUserId} = request.user!;
      try {
        const contacts = await Contact().where('ownerId', currentUserId).orderBy('title', 'asc').select();
        response.status(200).json({
          RqUid,
          contacts: contacts.map((entry: ContactValue) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url
          }))
        });
      } catch (e) {
        console.debug('GET contact/', e);
        response.status(500).json({RqUid}).end();
      }
    })
    .post(async (request, response) => {
      const {RqUid, title, url} = getArgs(request);
      const {id: currentUserId} = request.user!;
      try {
        const [contactId] = await Contact().returning('id').insert({title, url, ownerId: currentUserId});
        if (contactId)
          return response.status(200).json({RqUid, contactId}).end();
        return response.status(500).json({RqUid}).end();
      } catch (e) {
        console.debug('POST contact/', e);
        response.status(500).json({RqUid}).end();
      }
    });

export {
  singleContactRouter as SingleContactController,
  allContactsRouter as AllContactsController
};
