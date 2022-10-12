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
  await knex.raw(`CREATE TABLE lead (
    id SERIAL PRIMARY KEY,

    raw JSON NOT NULL,
    amo_lead_id BIGINT NOT NULL,
    status_id BIGINT NOT NULL,

    duplicate VARCHAR(128) NULL,
    duplicate_details VARCHAR(128) NULL,
    age INTEGER NULL,
    country VARCHAR(128) NULL,
    social VARCHAR(1024) NULL,
    how VARCHAR(1024) NULL,
    how_other VARCHAR(512) NULL,
    about VARCHAR(10000) NULL,
    profession VARCHAR(128) NULL,
    profession_details VARCHAR(1024) NULL,
    lead_group VARCHAR(1024) NULL,
    own_business VARCHAR(512) NULL,
    help VARCHAR(1024) NULL,
    looking_for VARCHAR(1024) NULL,
    looking_for_other VARCHAR(1024) NULL,
    privacy BOOLEAN NULL,
    rules BOOLEAN NULL,
    is_cool BOOLEAN NULL,
    email VARCHAR(256) NULL,
    name VARCHAR(256) NULL,
    ban BOOLEAN NULL
  )`);
};

exports.down = async function(knex) {
  await knex.raw('DROP TABLE leads');
};


