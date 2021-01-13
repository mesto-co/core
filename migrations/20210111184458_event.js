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

exports.up = async function(knex) {
  await knex.raw(`INSERT INTO permission(id, description) VALUES (2, 'Allow to activate user')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (3, 'Allow to ban user')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (4, 'Allow to add user')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (5, 'Allow to send invite email')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (6, 'Allow to exists users')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (7, 'Allow to add/edit event')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (8, 'Allow to del event')`);

  await knex.raw(`CREATE TYPE event_status_t as enum('created', 'deleted');`);
  await knex.raw(`CREATE TABLE event (
        id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
        creator uuid references "User"(id),
        time TIMESTAMP NOT NULL,
        title varchar(128) NOT NULL CHECK (title <> ''),
        description varchar(4096) NOT NULL CHECK (description <> ''),
        image varchar(256) NULL,
        link varchar(256) NOT NULL CHECK (link <> ''),
        status event_status_t
    )`);
  await knex.raw(`CREATE TABLE event_user (
        user_id uuid references "User"(id),
        event_id uuid references event(id)
    )`);
  await knex.raw('CREATE INDEX event_user_user_id_index on event_user(user_id)');
  await knex.raw('CREATE INDEX event_user_event_id_index on event_user(event_id)');
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX event_user_user_id_index');
  await knex.raw('DROP INDEX event_user_event_id_index');
  await knex.raw('DROP TABLE event_user');
  await knex.raw('DROP TABLE event');

  await knex.raw('DELETE FROM permission WHERE id IN (2, 3, 4, 5, 6, 7, 8)');
};
