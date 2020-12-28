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
import { getArgs } from '../utils';

const addPermission = express.Router();
addPermission.route('/').post(async (request, response) => {
  try {
    const {permissions} = request.user!;
    if (!permissions || !permissions.includes(Permission.ADDDELPERMISSION))
      return response.status(401).json({}).end();
    const {permission_id, user_id} = getArgs(request);
    if (!Object.values(Permission).includes(permission_id))
      return response.status(400).json({}).end();
    await knex.raw('INSERT INTO user_permission(user_id, permission_id) VALUES (?, ?)', [user_id, permission_id]);
    return response.status(200).json({}).end();
  } catch (e) {
    console.debug('POST user/addPermission error', e);
    response.status(500).json({}).end();
  }
});

const delPermission = express.Router();
delPermission.route('/').post(async (request, response) => {
  try {
    const {permissions} = request.user!;
    if (!permissions || !permissions.includes(Permission.ADDDELPERMISSION))
      return response.status(401).json({}).end();
    const {permission_id, user_id} = getArgs(request);
    if (!Object.values(Permission).includes(permission_id))
      return response.status(400).json({}).end();
    await knex.raw('DELETE FROM user_permission WHERE user_id = ? AND permission_id = ?', [user_id, permission_id]);
    return response.status(200).json({}).end();
  } catch (e) {
    console.debug('POST user/delPermission error', e);
    response.status(500).json({}).end();
  }
});

export {
  addPermission,
  delPermission
};
