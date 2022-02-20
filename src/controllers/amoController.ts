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

const {
  amoToken
} = require('../../config.js');

const amoController = express.Router();
amoController.route('/')
    .get(async (request, response) => {
      const args = getArgs(request);
      if (args && args.token === amoToken) {
        console.debug('amoController#get', args);
        return response.status(200).json({}).end();
      }
      return response.status(401).json({}).end();
    })
    .post(async (request, response) => {
      const args = getArgs(request);
      if (args && args.token === amoToken) {
        const emailUpdates = [];
        const leadsUpdates = [];
        const contactsDeleted = [];

        for (let i = 0; true; ++i) {
          const prefix = `contacts[update][${i}]`;
          const id = args[prefix + '[id]'];
          if (id) {
            for (let j = 0; true; ++j) {
              if (args[prefix + `[custom_fields][${j}][code]`] === 'EMAIL') {
                emailUpdates.push({
                  email: args[prefix + `[custom_fields][${j}][values][0][value]`].toLowerCase(),
                  id: id,
                  name: args[prefix + '[name]']
                });
                break;
              } else if (!args[`contacts[update][${i}][custom_fields][${j}][id]`]) {
                break;
              }
            }
            for (let j = 0; true; ++j) {
              const name = args[prefix + `[tags][${j}][name]`];
              if (!name)
                break;
              if (args[prefix + `[tags][${j}][name]`] === 'Забанен')
                contactsDeleted.push(id);
            }
            for (const arg in args) {
              if (arg.startsWith(prefix + '[linked_leads_id]')) {
                leadsUpdates.push({
                  id: id,
                  leadId: args[arg]
                });
                break;
              }
            }
          } else {
            break;
          }
        }

        for (let i = 0; true; ++i) {
          const id = args[`contacts[delete][${i}][id]`];
          if (id)
            contactsDeleted.push(id);
          else
            break;
        }

        const approvedLeads = [];
        for (let i = 0; true; ++i) {
          const id = args[`leads[update][${i}][id]`];
          if (id) {
            if (args[`leads[update][${i}][status_id]`] === '142')
              approvedLeads.push(id);
          } else {
            break;
          }
        }

        for (const emailUpdate of emailUpdates)
          await knex.raw('UPDATE "User" SET email = ? WHERE amo_id = ?', [emailUpdate.email, emailUpdate.id]);
        for (const emailUpdate of emailUpdates)
          await knex.raw('INSERT INTO "User" (email, "fullName", amo_id, status, about) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING', [emailUpdate.email, emailUpdate.name, emailUpdate.id, 'awaiting', '']);
        for (const leadUpdate of leadsUpdates)
          await knex.raw('UPDATE "User" SET amo_lead_id = ? WHERE amo_id = ?', [leadUpdate.leadId, leadUpdate.id]);
        for (const id of contactsDeleted)
          await knex.raw('UPDATE "User" SET status = ? WHERE amo_id = ?', [UserStatus.CLOSED, id]);
        for (const leadId of approvedLeads)
          await knex.raw('UPDATE "User" SET status = ? WHERE amo_lead_id = ?', [UserStatus.APPROVED, leadId]);

        return response.status(200).json({}).end();
      }
      return response.status(401).json({}).end();
    });

export {
  amoController
};
