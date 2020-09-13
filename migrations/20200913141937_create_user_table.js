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
const userStatuses = [
  'awaiting',
  'approved',
  'rejected',
  'closed',
];

exports.up = function(knex) {
  return knex.schema.createTable('User', function(table) {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('lastName').nullable();
    table.string('firstName').nullable();
    table.string('middleName').nullable();
    table.string('username', 30).nullable().unique();
    table.string('email').notNullable().unique();
    table.string('passwordHash').nullable();
    table.string('imagePath').nullable();
    table.string('location').nullable(); // TODO(icekhab): we need to create directory for geo.
    table.string('phone', 50).nullable();
    table.string('about', 6000).nullable();
    table.string('role').nullable(); // TODO(icekhab): we need to create directory for roles.
    table.enum('status', userStatuses).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('User');
};
