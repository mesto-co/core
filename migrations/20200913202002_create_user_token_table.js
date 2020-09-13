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

exports.up = function(knex) {
  return knex.schema.createTable('UserToken', function(table) {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('token').notNullable();
    table.boolean('isActive').notNullable().defaultTo(true);
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.uuid('userId').notNullable();
    table.foreign('userId').references('User.id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('UserToken');
};
