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
  await knex('search_word_user').del();
  await knex('UserToken')
      .del();
  await knex('Friend')
      .del();
  await knex('Contact')
      .del();

  return knex('User')
      .del()
      .then(function() {
        return knex('User').insert([
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000001\'::uuid'),
            fullName: 'Иван Рябинин',
            username: 'iryabinin',
            email: 'iryabinin@gmail.com',
            passwordHash: 'HASH',
            imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
            location: '',
            phone: '',
            about: 'Привет всем! Я Иван Рябинин',
            role: null,
            status: 'approved',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000002\'::uuid'),
            fullName: 'Заблокированный Пользователь',
            username: 'closed',
            email: 'closed@gmail.com',
            passwordHash: 'HASH',
            imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
            location: '',
            phone: '',
            about: 'Привет всем! Я Заблокирован',
            role: null,
            status: 'closed',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000003\'::uuid'),
            fullName: 'Отклоненный Пользователь',
            username: 'rejected',
            email: 'rejected@gmail.com',
            passwordHash: 'HASH',
            imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
            location: '',
            phone: '',
            about: 'Привет всем! Я Отклонен',
            role: null,
            status: 'rejected',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000004\'::uuid'),
            fullName: 'Ожидающий Пользователь',
            username: 'awaiting',
            email: 'awaiting@gmail.com',
            passwordHash: 'HASH',
            imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
            location: '',
            phone: '',
            about: 'Привет всем! Я Жду подтверждения',
            role: null,
            status: 'awaiting',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000005\'::uuid'),
            fullName: 'Анастасия Кулибина',
            username: 'akulibina',
            email: 'akulibina@gmail.com',
            passwordHash: 'HASH',
            imagePath: 'https://lv.wikipedia.org/wiki/Att%C4%93ls:Kulibin_I_P.jpg',
            location: '',
            phone: '',
            about: 'Привет всем! Я Кулибина Настя',
            role: null,
            status: 'approved',
            skills: ['MVP', 'Мобильная разработка', 'NodeJS']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000006\'::uuid'),
            fullName: 'Александр Александров',
            username: 'alex',
            email: 'alex@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет всем!',
            status: 'approved',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000007\'::uuid'),
            fullName: 'Иван Иванов',
            username: 'ivan',
            email: 'ivan@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет всем!',
            location: 'Бали',
            status: 'approved',
            skills: ['Improvements']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000008\'::uuid'),
            fullName: 'Volodymyr',
            username: 'volodya',
            email: 'volodya@gmail.com',
            passwordHash: 'HASH',
            about: 'тестируюсь на сохранение!',
            location: 'Бали',
            status: 'approved',
            skills: ['навык 0']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000009\'::uuid'),
            fullName: 'admin',
            username: 'admin',
            email: 'admin@gmail.com',
            passwordHash: 'HASH',
            about: 'admin',
            location: 'admin',
            status: 'approved',
            skills: []
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000010\'::uuid'),
            fullName: 'Сергей',
            username: 'user10',
            email: 'user10@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет',
            location: 'admin',
            status: 'approved',
            skills: ['startup']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000011\'::uuid'),
            fullName: 'Sergey',
            username: 'user11',
            email: 'user11@gmail.com',
            passwordHash: 'HASH',
            about: 'Местный',
            location: 'admin',
            status: 'approved',
            skills: ['startup']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000012\'::uuid'),
            fullName: 'Sergei',
            username: 'user12',
            email: 'user12@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет',
            location: 'admin',
            status: 'approved',
            skills: []
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000013\'::uuid'),
            fullName: 'Игорь',
            username: 'user13',
            email: 'user13@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет',
            location: 'Сергеев',
            status: 'approved',
            skills: []
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000014\'::uuid'),
            fullName: 'Никита',
            username: 'user14',
            email: 'user14@gmail.com',
            passwordHash: 'HASH',
            about: 'Привет',
            location: '',
            status: 'approved',
            skills: ['сергей']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000015\'::uuid'),
            fullName: 'Игорь',
            username: 'user15',
            email: 'user15@gmail.com',
            passwordHash: 'HASH',
            about: 'Помогаю только Сергеям',
            location: '',
            status: 'approved',
            skills: ['микроконтроллеры']
          },
          {
            id: knex.raw('\'00000000-1111-2222-3333-000000000016\'::uuid'),
            fullName: 'Безликий',
            username: 'user16',
            email: 'user16@gmail.com',
            passwordHash: 'HASH',
            about: 'Нет about',
            location: '',
            status: 'approved',
            skills: []
          }
        ]);
      });
};
