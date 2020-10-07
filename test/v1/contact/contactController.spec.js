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

const { get, post, put, del, getHost, getAuthHeader } = require('../../utils.js');

const CONTACT_ENDPOINT = `${getHost()}/v1/contact/`;
const header = getAuthHeader({
  id: '00000000-1111-2222-3333-000000000001',
  fullName: 'Иван Рябинин',
});

async function checkCurrentContacts(expected) {
  const {code: getAllCode, data: getAllData} = await get(CONTACT_ENDPOINT, header);
  expect(getAllCode).toBe(200);
  expect(getAllData.contacts.length).toBe(expected.length);
  const compareContacts = (a,b) => a.title === b.title ? 0 : a.title > b.title ? 1 : -1;
  getAllData.contacts.sort(compareContacts);
  expected.sort(compareContacts);
  for (let i = 0; i < expected.length; ++i) {
    expect(getAllData.contacts[i].title).toBe(expected[i].title);
    expect(getAllData.contacts[i].url).toBe(expected[i].url);
  }
}

const getAllExpected = [
  {
    title: 'LinkedIn',
    url: 'https://www.linkedin.com/in/iryabinin'
  },
  {
    title: 'Telegram',
    url: 'http://t.me/iryabinin'
  }
];

test('/v1/contact', async () => {
  // check that we can fetch contacts for current user
  await checkCurrentContacts(getAllExpected);

  // check that we can add a contact to current user
  const newContactDataExpected = {
    title: 'ZNetwork',
    url: 'http://mynextbigsocialnetwork/abc'
  };
  const {code: newContactCode, data: newContactData} = await post(CONTACT_ENDPOINT, JSON.stringify(newContactDataExpected), header);
  expect(newContactCode).toBe(200);
  expect(newContactData.contactId).toBeDefined();

  await checkCurrentContacts([...getAllExpected, newContactDataExpected]);

  // check that we can edit contact
  const updatedNewContactExpected = {title: 'Zmytitle', url: 'myurl'};
  const {code: updateContactCode} = await put(CONTACT_ENDPOINT + newContactData.contactId, JSON.stringify(updatedNewContactExpected), header);
  expect(updateContactCode).toBe(200);

  await checkCurrentContacts([...getAllExpected, updatedNewContactExpected]);

  // check that we can delete contact
  const {code: deleteContactCode} = await del(CONTACT_ENDPOINT + newContactData.contactId, header);
  expect(deleteContactCode).toBe(200);
  await checkCurrentContacts(getAllExpected);
});

test('/v1/contact bad new contact', async () => {
  await checkCurrentContacts(getAllExpected);
  // no title and url
  await check({});
  // no url
  await check({title: 'mytitle'});
  // no title
  await check({url: 'http://myurl'});
  // long title
  await check({title: 'x'.repeat(1024), url: 'http://myurl'});
  // long url
  await check({title: 'abc', url: 'http://myurl/' + 'x'.repeat(1024)});

  async function check(badContractData) {
    const {code: newContactCode} = await post(CONTACT_ENDPOINT, JSON.stringify(badContractData), header);
    expect(newContactCode).toBe(400);
    await checkCurrentContacts(getAllExpected);
  }
});

test('/v1/contact bad updated contact', async () => {
  await checkCurrentContacts(getAllExpected);
  const testContact = {title: 'Ztest', url: 'http://example.com'};
  const {data: {contactId}} = await post(CONTACT_ENDPOINT, JSON.stringify(testContact), header);

  // contactId is not uuid
  await check('0', {title: 'test', url: 'http://example.com'}, 400);
  // contactId does not exist
  await check('00000000-1111-2222-3333-000000000007', {title: 'test', url: 'http://example.com'}, 404);
  // no url
  await check(contactId, {title: 'test'}, 400);
  // no title
  await check(contactId, {url: 'http://example.com'}, 400);
  // existing title + url
  await check(contactId, getAllExpected[0], 422);

  await del(CONTACT_ENDPOINT + contactId, header);
  await checkCurrentContacts(getAllExpected);

  async function check(contactId, data, expectedCode) {
    const {code: updateContactCode} = await put(CONTACT_ENDPOINT + contactId, JSON.stringify(data), header);
    expect(updateContactCode).toBe(expectedCode);
    await checkCurrentContacts([...getAllExpected, testContact]);
  }
});

test('/v1/contact bad deleted contact', async () => {
  await checkCurrentContacts(getAllExpected);
  const testContact = {title: 'Ztest', url: 'http://example.com'};
  const {data: {contactId}} = await post(CONTACT_ENDPOINT, JSON.stringify(testContact), header);

  // contactId is not uuid
  await check('0', 400);
  // contactId does not exist - there is no record with given contactId so 200
  await check('00000000-1111-2222-3333-000000000007', 200);

  await del(CONTACT_ENDPOINT + contactId, header);
  await checkCurrentContacts(getAllExpected);

  async function check(contactId, expectedCode) {
    const {code} = await del(CONTACT_ENDPOINT + contactId, header);
    expect(code).toBe(expectedCode);
    await checkCurrentContacts([...getAllExpected, testContact]);
  }
});

test('/v1/contact unauthorized', async () => {
  const {code: getAllCode} = await get(CONTACT_ENDPOINT);
  expect(getAllCode).toBe(401);
  const {code: postCode} = await post(CONTACT_ENDPOINT, JSON.stringify({title: 'title', url: 'http://url'}));
  expect(postCode).toBe(401);
  const {code: delCode} = await del(CONTACT_ENDPOINT + '00000000-1111-2222-3333-000000000007');
  expect(delCode).toBe(401);
  const {code: putCode} = await put(CONTACT_ENDPOINT + '00000000-1111-2222-3333-000000000007', JSON.stringify({title: 'title', url: 'http://url'}));
  expect(putCode).toBe(401);
});

test('/v1/contact empty title is error', async () => {
  await checkCurrentContacts(getAllExpected);
  const testContact = {title: '', url: 'http://example.com'};
  const {code} = await post(CONTACT_ENDPOINT, JSON.stringify(testContact), header);
  expect(code).toBe(400);
});
