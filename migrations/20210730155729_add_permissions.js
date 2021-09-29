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
  await knex.raw(`INSERT INTO permission(id, description) VALUES (10, 'Resolve user email to user id')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (11, 'Update user email')`);
  await knex.raw(`INSERT INTO permission(id, description) VALUES (12, 'Completely remove user')`);
};

exports.down = async function(knex) {
  await knex.raw(`DELETE FROM permission WHERE id = 10`);
  await knex.raw(`DELETE FROM permission WHERE id = 11`);
  await knex.raw(`DELETE FROM permission WHERE id = 12`);
};
