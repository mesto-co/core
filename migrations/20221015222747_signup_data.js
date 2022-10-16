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
  await knex.raw(`CREATE TABLE signup_data (
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid references "User"(id) NOT NULL,

    name TEXT NOT NULL,
    email TEXT NOT NULL,
    birthdate DATE NULL,
    birthdate_precision VARCHAR(5) NULL,
    country TEXT NULL,
    social_media_link TEXT NULL,
    telegram TEXT NULL,
    heard_about_us TEXT[] NULL,
    about_me TEXT NULL,
    profession TEXT NULL,
    profession_details TEXT NULL,
    groups TEXT[] NULL,
    project_type TEXT[] NULL,
    project_details TEXT NULL,
    can_help TEXT[] NULL,
    looking_for TEXT[] NULL
  )`);
  await knex.raw(`CREATE UNIQUE INDEX unique_user_id_signup_data ON signup_data (user_id)`);
};

exports.down = async knex => {
  await knex.raw(`DROP INDEX unique_user_id_signup_data`);
  await knex.raw('DROP TABLE signup_data');
};

