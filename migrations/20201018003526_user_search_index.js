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
  await knex.raw('CREATE INDEX user_skills_index on "User" USING GIN (skills)');
  await knex.raw('CREATE INDEX user_place_id_index on "User"(place_id)');
  // we do not need a separate index on boolean busy flag - such index will be ignored by Postgres,
  // random IO required for working with index is slower than sequenced read and check for flag.
  await knex.raw('CREATE INDEX search_word_word_index ON search_word USING GIST (word gist_trgm_ops)');
};

exports.down = async knex => {
  await knex.raw('DROP INDEX search_word_word_index');
  await knex.raw('DROP INDEX user_place_id_index');
  await knex.raw('DROP INDEX user_skills_index');
};
