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

const faker = require('faker');

exports.seed = function(knex) {
  faker.locale = 'ru';
  const users = [
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
      skills: ['Improvements', 'Office']
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
      status: 'closed'
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
      status: 'rejected'
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
      status: 'awaiting'
    }, {
      id: knex.raw('\'00000000-1111-2222-3333-000000000005\'::uuid'),
      fullName: 'Александр Кулибякин',
      username: 'Kulik',
      email: 'iryabinin2@gmail.com',
      passwordHash: 'HASH',
      imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
      location: 'Санкт-Петербург, Россия',
      phone: '',
      about: 'Fullstack разработчик и со-основатель проекта Sensivo.eu. С 2010 занимался разработкой IT систем в пожаро-охранной сфере и разными стартапами, в 2017 году переехал в Стокгольм на однолетнюю программу по предпринимательству чтобы понять как делать стартапы и попасть в нужную среду.  После окончание открыл проект с партнерами. Сейчас разрабатываем коммерчески успещнй и третий по счёту проект. ',
      role: 'Мастер слова и клинка',
      status: 'approved',
      skills: ['Sofware developer', 'Product owner']
    },
    {
      id: knex.raw('\'00000000-1111-2222-3333-000000000006\'::uuid'),
      fullName: 'Петр Игнатиевич Панфилов',
      username: 'Ku2lik',
      email: 'iryabin3in2@gmail.com',
      passwordHash: 'HASH',
      imagePath: 'https://store.playstation.com/store/api/chihiro/00_09_000/container/IN/en/999/EP1257-CUSA07617_00-AV00000000000004/1586170996000/image?w=240&h=240&bg_color=000000&opacity=100&_version=00_09_000',
      location: 'Острова по среди средиземного моря, Океания',
      phone: '',
      about: 'Fullstack разработчик и со-основатель проекта Sensivo.eu. С 2010 занимался разработкой IT систем в пожаро-охранной сфере и разными стартапами, в 2017 году переехал в Стокгольм на однолетнюю программу по предпринимательству чтобы понять как делать стартапы и попасть в нужную среду.  После окончание открыл проект с партнерами. Сейчас разрабатываем коммерчески успещнй и третий по счёту проект. ',
      role: 'Мастер слова и клинка он глядит в свою ладонь',
      status: 'approved',
      skills: ['Хороший парень', 'Sofware engineer','SMM','Vuejs','angular']
    },
  ];

  for (let index = 0; index < 100; index++) {
    users.push({
      fullName: `${faker.name.firstName()} ${faker.name.firstName()}` ,
      username: faker.internet.userName(),
      email: faker.internet.email(),
      passwordHash: 'HASH',
      imagePath: faker.internet.avatar(),
      location: `${faker.address.country()} ${faker.address.city()}`,
      phone: '',
      about: faker.lorem.text(),
      role: faker.name.jobTitle(),
      status: 'approved',
      skills: [faker.name.jobArea(),faker.name.jobArea(),faker.name.jobArea()]
    });

  }

  return knex('User')
      .del()
      .then(function() {
        return knex('User').insert(users);
      });
};
