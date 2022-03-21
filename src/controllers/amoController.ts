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

const parseObject = (data: object): object => {
  const inited = Symbol('inited');
  const output = {};
  for (const item in data) {
    const path = item.split(/[[\]]+/g);
    if (path.length > 1)
      path.pop();
    const targetKey = path.pop();
    let obj = output;
    for (const key of path) {
      // @ts-ignore
      if (!obj[key] || !obj[key][inited]) {
        // @ts-ignore
        obj[key] = [];
        // @ts-ignore
        obj[key][inited] = true;
      }
      // @ts-ignore
      obj = obj[key];
    }
    // @ts-ignore
    obj[targetKey] = data[item];
  }
  return output;
};

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
        const contactsDeleted = [];
        const leadsUpdates = [];
        const approvedLeads = [];
        const aboutUpdateCollection = [];
        const contactsRestored = [];

        const amoData = parseObject(args);
        // @ts-ignore
        if (amoData.contacts && amoData.contacts.update) {
          // @ts-ignore
          for (const update of amoData.contacts.update) {
            // @ts-ignore
            const emailCustomField = update.custom_fields ? update.custom_fields.find(field => field.code === 'EMAIL') : null;
            if (emailCustomField && emailCustomField.values.length) {
              emailUpdates.push({
                email: emailCustomField.values[0].value.toLowerCase(),
                id: update.id,
                name: update.name
              });
            }
            // @ts-ignore
            if (update.tags && update.tags.find(tag => tag.name.toLowerCase() === 'забанен'))
              contactsDeleted.push(update.id);
            else
              contactsRestored.push(update.id);

            if (update.linked_leads_id && update.linked_leads_id.length) {
              leadsUpdates.push({
                id: update.id,
                leadId: update.linked_leads_id.pop().ID
              });
            }
          }
        }
        // @ts-ignore
        if (amoData.contacts && amoData.contacts.delete) {
          // @ts-ignore
          for (const item of amoData.contacts.delete)
            contactsDeleted.push(item.id);
        }
        // @ts-ignore
        if (amoData.leads && amoData.leads.update) {
          // @ts-ignore
          for (const item of amoData.leads.update) {
            if (item.status_id === '142') {
              approvedLeads.push(item.id);
              // @ts-ignore
              const aboutMe = (item.custom_fields || []).find(field => field.code === 'ABOUT_MEE');
              if (aboutMe && aboutMe.values.length) {
                aboutUpdateCollection.push({
                  aboutMe: aboutMe.values[0].value.substr(0, 6000),
                  id: item.id
                });
              }
            }
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
          await knex.raw('UPDATE "User" SET status = ? WHERE amo_lead_id = ? AND status != ?', [UserStatus.APPROVED, leadId, UserStatus.CLOSED]);
        for (const aboutUpdate of aboutUpdateCollection)
          await knex.raw('UPDATE "User" SET about = ? WHERE amo_id = ? AND status != ?', [aboutUpdate.aboutMe, aboutUpdate.id, UserStatus.CLOSED]);
        for (const id of contactsRestored)
          await knex.raw('UPDATE "User" SET status = ? WHERE amo_id = ? AND status = ?', [UserStatus.APPROVED, id, UserStatus.CLOSED]);

        return response.status(200).json({}).end();
      }
      return response.status(401).json({}).end();
    });

export {
  amoController
};
