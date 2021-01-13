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

const { getAuthHeader, getHost, genUsers, post, get } = require('../utils.js');

test('/v1/event/addEvent', async () => {
  const [user] = await genUsers(1610476835367, [{}]);
  const authHeader = getAuthHeader({id: user.id, permissions: [7, 8]});
  const addEvent = (data, header = authHeader) => post(getHost() + '/v1/event/addEvent', data, header);
  const getEvent = id => get(getHost() + '/v1/event/getEvent?id=' + id, authHeader);
  const delEvent = id => post(getHost() + '/v1/event/delEvent', {id}, authHeader);
  const eventData = { time: new Date().toISOString(), title: 'event', description: 'description', link: 'https://youtube.com/abc'};
  const result = await addEvent(eventData);
  expect(await getEvent(result.data.id)).toMatchObject({
    code: 200,
    data: {time: eventData.time, title: eventData.title, description: eventData.description}
  });
  expect(await getEvent('d5ab3356-f4b4-11ea-adc1-0242ac120002')).toMatchObject({
    code: 404
  });
  expect(result).toMatchObject({code: 200, data: { id: expect.any(String) }});
  expect(await delEvent(result.data.id)).toMatchObject({code: 200});

  expect(await addEvent({...eventData, time: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, time: 'not-a-time-string'})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: ''})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: 'a'.repeat(129)})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, description: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, description: ''})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, description: 'a'.repeat(4097)})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, link: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, link: 'a'.repeat(257)})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, link: 'a'.repeat(256)})).toMatchObject({code: 400});

  const unauthorizedHeader = getAuthHeader({id: user.id});
  expect(await addEvent(eventData, unauthorizedHeader)).toMatchObject({code: 401});
});

test('/v1/event/editEvent', async () => {
  const [user, anotherUser] = await genUsers(1610519232069, [{}, {}]);
  const authHeader = getAuthHeader({id: user.id, permissions: [7, 8]});
  const anotherUserHeader = getAuthHeader({id: anotherUser.id, permissions: [7, 8]});

  const addEvent = (data, header = authHeader) => post(getHost() + '/v1/event/addEvent', data, header);
  const getEvent = id => get(getHost() + '/v1/event/getEvent?id=' + id, authHeader);
  const editEvent = (id, data, header = authHeader) => post(getHost() + '/v1/event/editEvent', {...data, id}, header);
  const delEvent = id => post(getHost() + '/v1/event/delEvent', {id}, authHeader);
  const eventData = { time: new Date().toISOString(), title: 'event', description: 'description', link: 'https://youtube.com/abc'};
  const {data: {id}} = await addEvent(eventData);

  const withUpdatedTime = {...eventData, time: new Date().toISOString()};
  expect(await editEvent(id, withUpdatedTime)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedTime});

  const withUpdatedTitle = {...eventData, title: 'new-title'};
  expect(await editEvent(id, withUpdatedTitle)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedTitle});

  const withUpdatedDescription = {...eventData, description: 'new description'};
  expect(await editEvent(id, withUpdatedDescription)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedDescription});

  const withUpdatedLink = {...eventData, link: 'https://youtube.com/abc2'};
  expect(await editEvent(id, withUpdatedLink)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedLink});

  const withUpdatedImage = {...eventData, image: 'https://example.com/abc'};
  expect(await editEvent(id, withUpdatedImage)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedImage});

  expect(await editEvent('', {...eventData, time: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, time: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, time: 'not-a-time-string'})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: ''})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: 'a'.repeat(129)})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, description: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, description: 'a'.repeat(4097)})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, link: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, link: 'a'.repeat(257)})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, link: 'a'.repeat(256)})).toMatchObject({code: 400});
  expect(await editEvent('d5ab3356-f4b4-11ea-adc1-0242ac120002', eventData)).toMatchObject({code: 404});
  expect(await editEvent(id, eventData, anotherUserHeader)).toMatchObject({code: 404});
  const unauthorizedHeader = getAuthHeader({id: user.id});
  expect(await editEvent(id, eventData, unauthorizedHeader)).toMatchObject({code: 401});
  expect(await delEvent(id)).toMatchObject({code: 200});
  expect(await editEvent(id, withUpdatedImage)).toMatchObject({code: 404});
});

test('/v1/event/delEvent', async () => {
  const [user, anotherUser] = await genUsers(1610520856202, [{}, {}]);
  const authHeader = getAuthHeader({id: user.id, permissions: [7]});
  const anotherUserHeader = getAuthHeader({id: anotherUser.id, permissions: [8]});
  const unauthorizedHeader = getAuthHeader({id: anotherUser.id});

  const addEvent = (data, header = authHeader) => post(getHost() + '/v1/event/addEvent', data, header);
  const delEvent = (id, header = authHeader) => post(getHost() + '/v1/event/delEvent', {id}, header);
  const eventData = { time: new Date().toISOString(), title: 'event', description: 'description', link: 'https://youtube.com/abc'};
  {
    // user with special permission can remove any event
    const {data: {id}} = await addEvent(eventData);
    expect(await delEvent(id, anotherUserHeader)).toMatchObject({code: 200});
  }
  {
    // can remove own event
    const {data: {id}} = await addEvent(eventData);
    expect(await delEvent(id, authHeader)).toMatchObject({code: 200});
  }
  {
    const {data: {id}} = await addEvent(eventData);
    expect(await delEvent(id, unauthorizedHeader)).toMatchObject({code: 401});
    expect(await delEvent(id)).toMatchObject({code: 200});
  }
});

test('/v1/event/joinEvent', async () => {
  const [user, anotherUser] = await genUsers(1610520856202, [{}, {}]);
  const authHeader = getAuthHeader({id: user.id, permissions: [7]});
  const anotherUserHeader = getAuthHeader({id: anotherUser.id});
  const addEvent = (data, header = authHeader) => post(getHost() + '/v1/event/addEvent', data, header);
  const getEvent = (id, header = authHeader) => get(getHost() + '/v1/event/getEvent?id=' + id, header);
  const joinEvent = (id, header = authHeader) => post(getHost() + '/v1/event/joinEvent', {id}, header);
  const unjoinEvent = (id, header = authHeader) => post(getHost() + '/v1/event/unjoinEvent', {id}, header);
  const delEvent = id => post(getHost() + '/v1/event/delEvent', {id}, authHeader);

  const eventData = { time: new Date().toISOString(), title: 'event', description: 'description', link: 'https://youtube.com/abc'};
  const {data: {id}} = await addEvent(eventData);

  const withoutLink = {time: eventData.time, title: eventData.title, description: eventData.description};
  expect(await getEvent(id)).toMatchObject({code: 200, data: eventData});
  expect(await getEvent(id, anotherUserHeader)).toMatchObject({code: 200, data: withoutLink});
  expect(await joinEvent(id, anotherUserHeader)).toMatchObject({code: 200});
  expect(await getEvent(id, anotherUserHeader)).toMatchObject({code: 200, data: eventData});
  expect(await unjoinEvent(id, anotherUserHeader)).toMatchObject({code: 200});
  expect(await getEvent(id, anotherUserHeader)).toMatchObject({code: 200, data: withoutLink});

  expect(await joinEvent('not-a-uuid', anotherUserHeader)).toMatchObject({code: 400});
  expect(await joinEvent('d5ab3356-f4b4-11ea-adc1-0242ac120002', anotherUserHeader)).toMatchObject({code: 404});
  expect(await unjoinEvent('not-a-uuid', anotherUserHeader)).toMatchObject({code: 400});
  expect(await unjoinEvent('d5ab3356-f4b4-11ea-adc1-0242ac120002', anotherUserHeader)).toMatchObject({code: 200});

  expect(await delEvent(id)).toMatchObject({code: 200});
});
