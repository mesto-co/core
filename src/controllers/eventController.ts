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
import { Permission } from '../enums/permission';
import knex from '../knex';
import { getArgs, hasPermission } from '../utils';

enum EventStatus {
    CREATED = 'created',
    DELETED = 'deleted',
}

const getEvent = express.Router();
getEvent.route('/').get(async (request, response) => {
  try {
    const {id} = getArgs(request);
    const currentUser = request.user!.id;
    const {rows: rowsJoin} = await knex.raw('SELECT 1 FROM event_user WHERE event_id = :id AND user_id = :currentUser', { id, currentUser });
    const joined = rowsJoin.length > 0;
    const {rows: [eventRow]} = await knex.raw(`SELECT creator, time, title, description, image, link FROM event WHERE id = :id AND status = :status`, { id, status: EventStatus.CREATED });
    if (!eventRow)
      return response.status(404).json({}).end();
    let result = {
      creator: eventRow.creator,
      time: eventRow.time,
      title: eventRow.title,
      description: eventRow.description
    };
    if (eventRow.image)
      result = Object.assign(result, {image: eventRow.image});
    if (joined || eventRow.creator === currentUser)
      result = Object.assign(result, {link: eventRow.link});
    return response.status(200).json(result).end();
  } catch (e) {
    console.debug('POST event/get error', e);
    response.status(500).json({}).end();
  }
});

const addEvent = express.Router();
addEvent.route('/').post(async (request, response) => {
  try {
    if (!hasPermission(request, Permission.EVENT))
      return response.status(401).json({}).end();
    const creator = request.user!.id;
    const {time, title, description, image, link} = getArgs(request);
    const {rows: [{id}]} = await knex.raw('INSERT INTO event(creator, time, title, description, image, link, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id', [creator, time, title, description, image || null, link, EventStatus.CREATED]);
    return response.status(200).json({id}).end();
  } catch (e) {
    // invalid_datetime_format
    if (e.code === '22007')
      return response.status(400).json({message: 'Invalid time format'}).end();
    if (e.code === '23514')
      return response.status(400).json({message: 'Invalid creator'}).end();
    console.debug('POST event/add error', e);
    return response.status(500).json({}).end();
  }
});

const editEvent = express.Router();
editEvent.route('/').post(async (request, response) => {
  try {
    if (!hasPermission(request, Permission.EVENT))
      return response.status(401).json({}).end();
    const currentUser = request.user!.id;
    const {id, title, time, description, image, link} = getArgs(request);
    const {rowCount} = await knex.raw('UPDATE event SET title = :title, description = :description, image = :image, link = :link, time = :time WHERE id = :id AND creator = :currentUser AND status = :status', {
      title,
      description,
      image: image || null,
      time,
      link,
      id,
      currentUser,
      status: EventStatus.CREATED
    });
    if (rowCount < 1)
      return response.status(404).json({}).end();
    return response.status(200).json({}).end();
  } catch (e) {
    // invalid_datetime_format
    if (e.code === '22007')
      return response.status(400).json({message: 'Invalide time format'}).end();
    if (e.code === '23514')
      return response.status(400).json({message: 'Invalid creator'}).end();
    console.debug('POST event/edit', e);
    return response.status(500).json({}).end();
  }
});

const delEvent = express.Router();
delEvent.route('/').post(async (request, response) => {
  try {
    const {id} = getArgs(request);
    if (!hasPermission(request, Permission.DELEVENT)) {
      const currentUser = request.user!.id;
      const {rows} = await knex.raw('SELECT 1 FROM event WHERE id = :id AND creator = :currentUser', {id, currentUser});
      if (rows.length === 0)
        return response.status(401).json({}).end();
    }
    await knex.raw('UPDATE event SET status = :status WHERE id = :id', { id, status: EventStatus.DELETED });
    return response.status(200).json({}).end();
  } catch (e) {
    console.debug('POST event/del', e);
    response.status(500).json({}).end();
  }
});

const joinEvent = express.Router();
joinEvent.route('/').post(async (request, response) => {
  try {
    const {id} = getArgs(request);
    await knex.raw('INSERT INTO event_user(user_id, event_id) VALUES (:userId, :id)', {
      userId: request.user!.id,
      id
    });
    return response.status(200).json({}).end();
  } catch (e) {
    // FOREIGN KEY VIOLATION
    if (e.code === '23503')
      return response.status(404).json({message: 'User or event was not found'}).end();
    console.debug('POST event/join', e);
    return response.status(500).json({}).end();
  }
});

const unjoinEvent = express.Router();
unjoinEvent.route('/').post(async (request, response) => {
  try {
    const {id} = getArgs(request);
    await knex.raw('DELETE FROM event_user WHERE user_id = :userId AND event_id = :id', {
      userId: request.user!.id,
      id
    });
    return response.status(200).json({}).end();
  } catch (e) {
    console.debug('POST event/unjoin', e);
    return response.status(500).json({}).end();
  }
});

const searchEvents = express.Router();
searchEvents.route('/').post(async (request, response) => {
  try {
    const {createdByMe, joinedByMe, from, to, offset, count} = getArgs(request);
    let whereClause = ' WHERE e.time >= :from AND e.time <= :to AND e.status = :status';
    let joinClause = '';
    if (createdByMe)
      whereClause += ' AND creator = :user';
    if (joinedByMe)
      joinClause += ' INNER JOIN event_user eu ON eu.user_id = :user AND eu.event_id = e.id';
    else
      joinClause += ' LEFT JOIN event_user eu ON eu.user_id = :user AND eu.event_id = e.id';
    const userId = request.user!.id;
    const {rows} = await knex.raw(`SELECT e.id, e.creator, e.time, e.title, e.description, e.image, e.link, eu.user_id, count(*) OVER() AS total FROM event e ${joinClause}${whereClause} ORDER BY time ASC LIMIT :count OFFSET :offset`, {
      from, to, offset, count, user: userId, status: EventStatus.CREATED
    });
    const result = rows.map((row: { id: string; creator: string; time: string; title: string; description: string; image: string; user_id: string|undefined; link: string; }) => {
      let event = {
        id: row.id,
        creator: row.creator,
        time: row.time,
        title: row.title,
        description: row.description
      };
      if (row.image)
        event = Object.assign(event, { image: row.image });
      if (row.creator === userId || row.user_id)
        event = Object.assign(event, { link: row.link });
      return event;
    });
    const total = rows.length > 0 ? rows[0].total * 1 : 0;
    return response.status(200).json({ data: result, total: total }).end();
  } catch (e) {
    if (e.code === '22007')
      return response.status(400).json({message: 'Invalide time format'}).end();
    console.debug('POST event/search', e);
    return response.status(500).json({}).end();
  }
});

export { getEvent, addEvent, delEvent, editEvent, joinEvent, unjoinEvent, searchEvents };