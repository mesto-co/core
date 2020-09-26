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


exports.seed = async function(knex) {

  return knex('Contact')
      .del()
      .then(function() {
        return knex('Contact').insert([
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000001\'::uuid'),
            ownerId: knex.raw('\'00000000-1111-2222-3333-000000000001\'::uuid'),
            title: 'Telegram',
            url: 'http://t.me/iryabinin'
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000002\'::uuid'),
            ownerId: knex.raw('\'00000000-1111-2222-3333-000000000001\'::uuid'),
            title: 'LinkedIn',
            url: 'https://www.linkedin.com/in/iryabinin'
          }]);
      });
};
