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

exports.up = async knex => {
  await knex.raw('ALTER TABLE lead ALTER COLUMN duplicate TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN duplicate_details TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN country TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN social TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN how TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN how_other TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN about TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN profession TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN profession_details TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN lead_group TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN own_business TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN help TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN looking_for TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN looking_for_other TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN email TYPE TEXT');
  await knex.raw('ALTER TABLE lead ALTER COLUMN name TYPE TEXT');

  await knex.raw('ALTER TABLE event ALTER COLUMN category TYPE TEXT');
  await knex.raw('ALTER TABLE event ALTER COLUMN title TYPE TEXT');
  await knex.raw('ALTER TABLE event ALTER COLUMN description TYPE TEXT');
  await knex.raw('ALTER TABLE event ALTER COLUMN image TYPE TEXT');
  await knex.raw('ALTER TABLE event ALTER COLUMN link TYPE TEXT');

  await knex.raw('ALTER TABLE permission ALTER COLUMN description TYPE TEXT');

  await knex.raw('ALTER TABLE "User" ALTER COLUMN username TYPE TEXT');
  await knex.raw('ALTER TABLE "User" ALTER COLUMN phone TYPE TEXT');
  await knex.raw('ALTER TABLE "User" ALTER COLUMN about TYPE TEXT');
};

exports.down = async knex => {
  await knex.raw('ALTER TABLE lead ALTER COLUMN duplicate TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN duplicate_details TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN country TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN social TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN how TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN how_other TYPE VARCHAR(512)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN about TYPE VARCHAR(10000)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN profession TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN profession_details TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN lead_group TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN own_business TYPE VARCHAR(512)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN help TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN looking_for TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN looking_for_other TYPE VARCHAR(1024)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN email TYPE VARCHAR(256)');
  await knex.raw('ALTER TABLE lead ALTER COLUMN name TYPE VARCHAR(256)');

  await knex.raw('ALTER TABLE event ALTER COLUMN category TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE event ALTER COLUMN title TYPE VARCHAR(128)');
  await knex.raw('ALTER TABLE event ALTER COLUMN description TYPE VARCHAR(4096)');
  await knex.raw('ALTER TABLE event ALTER COLUMN image TYPE VARCHAR(256)');
  await knex.raw('ALTER TABLE event ALTER COLUMN link TYPE VARCHAR(256)');

  await knex.raw('ALTER TABLE permission ALTER COLUMN description TYPE VARCHAR(128)');

  await knex.raw('ALTER TABLE "User" ALTER COLUMN username TYPE VARCHAR(30)');
  await knex.raw('ALTER TABLE "User" ALTER COLUMN phone TYPE VARCHAR(50)');
  await knex.raw('ALTER TABLE "User" ALTER COLUMN about TYPE VARCHAR(6000)');
};
