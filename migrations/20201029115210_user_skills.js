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
  return knex.raw(`
    ALTER TABLE "User" ADD COLUMN skills_lo TEXT[] NOT NULL DEFAULT '{}';
    CREATE INDEX user_skills_lo_index on "User" USING GIN (skills_lo);
    UPDATE "User" SET skills_lo = LOWER(COALESCE(skills::text, '{}'))::text[];`);
};

exports.down = function(knex) {
  return knex.raw(`DROP INDEX user_skills_lo_index; ALTER TABLE "User" DROP COLUMN skills_lo;`);
};
