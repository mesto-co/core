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
  await knex.raw(`CREATE TABLE permission (
        id integer PRIMARY KEY,
        description varchar(128) NOT NULL CHECK (description <> '')
    )`);
  await knex.raw(`CREATE TABLE user_permission (
        user_id uuid references "User"(id),
        permission_id integer references permission(id)
    )`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (1, 'Allow to add any permission to any user')`);
};

exports.down = async function(knex) {
  await knex.raw('DROP TABLE user_permission');
  await knex.raw('DROP TABLE permission');
};
