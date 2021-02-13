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
  const eventData = { time: new Date().toISOString(), time_end: new Date().toISOString(), title: 'event', category: 'youtube', description: 'description', link: 'https://youtube.com/abc'};
  const result = await addEvent(eventData);
  expect(await getEvent(result.data.id)).toMatchObject({
    code: 200,
    data: {time: eventData.time, time_end: eventData.time_end, category: eventData.category, title: eventData.title, description: eventData.description}
  });
  expect(await getEvent('d5ab3356-f4b4-11ea-adc1-0242ac120002')).toMatchObject({
    code: 404
  });
  expect(result).toMatchObject({code: 200, data: { id: expect.any(String) }});
  expect(await delEvent(result.data.id)).toMatchObject({code: 200});

  expect(await addEvent({...eventData, time: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, time: 'not-a-time-string'})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, time_end: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, time_end: 'not-a-time-string'})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: ''})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, title: 'a'.repeat(129)})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, category: undefined})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, category: ''})).toMatchObject({code: 400});
  expect(await addEvent({...eventData, category: 'a'.repeat(129)})).toMatchObject({code: 400});
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
  const eventData = { time: new Date().toISOString(), time_end: new Date().toISOString(), category: 'youtube', title: 'event', description: 'description', link: 'https://youtube.com/abc'};
  const {data: {id}} = await addEvent(eventData);

  const withUpdatedTime = {...eventData, time: new Date().toISOString()};
  expect(await editEvent(id, withUpdatedTime)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedTime});

  const withUpdatedTimeEnd = {...eventData, time_end: new Date().toISOString()};
  expect(await editEvent(id, withUpdatedTimeEnd)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedTimeEnd});

  const withUpdatedTitle = {...eventData, title: 'new-title'};
  expect(await editEvent(id, withUpdatedTitle)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedTitle});

  const withUpdatedCategory = {...eventData, title: 'youtube2'};
  expect(await editEvent(id, withUpdatedCategory)).toMatchObject({code: 200});
  expect(await getEvent(id)).toMatchObject({code: 200, data: withUpdatedCategory});

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
  expect(await editEvent(id, {...eventData, time_end: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, time_end: 'not-a-time-string'})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: ''})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, title: 'a'.repeat(129)})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, category: undefined})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, category: ''})).toMatchObject({code: 400});
  expect(await editEvent(id, {...eventData, category: 'a'.repeat(129)})).toMatchObject({code: 400});
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
  const eventData = { time: new Date().toISOString(), time_end: new Date().toISOString(), category: 'youtube', title: 'event', description: 'description', link: 'https://youtube.com/abc'};
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

  const eventData = { time: new Date().toISOString(), time_end: new Date().toISOString(), category: 'youtube', title: 'event', description: 'description', link: 'https://youtube.com/abc'};
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

test('/v1/event/search', async () => {
  const [userA, userB] = await genUsers(1610520856202, [{}, {}]);
  const authHeader = getAuthHeader({id: userA.id, permissions: [7]});
  const anotherUserHeader = getAuthHeader({id: userB.id, permissions: [7]});
  const addEvent = (data, header) => post(getHost() + '/v1/event/addEvent', data, header);
  const joinEvent = (id, header = authHeader) => post(getHost() + '/v1/event/joinEvent', {id}, header);
  const delEvent = id => post(getHost() + '/v1/event/delEvent', {id}, authHeader);

  const searchEvent = (createdByMe, joinedByMe, from, to, offset, count, category, header = authHeader) => post(getHost() + '/v1/event/search', {createdByMe, joinedByMe, from, to, offset, count, category}, header);
  const eventData = [
    { time: new Date('05/16/20').toISOString(), time_end: new Date('05/16/20').toISOString(), title: 'event', category: 'youtube1', description: 'created by A, not joined', link: 'https://youtube.com/abc', creator: userA.id },
    { time: new Date('05/17/20').toISOString(), time_end: new Date('05/17/20').toISOString(), title: 'event', category: 'youtube2', description: 'created by B, not joined', link: 'https://youtube.com/abc', creator: userB.id },
    { time: new Date('05/18/20').toISOString(), time_end: new Date('05/18/20').toISOString(), title: 'event', category: 'youtube3', description: 'created by A, joined by A', link: 'https://youtube.com/abc', creator: userA.id },
    { time: new Date('05/19/20').toISOString(), time_end: new Date('05/19/20').toISOString(), title: 'event', category: 'youtube1', description: 'created by B, joined by A', link: 'https://youtube.com/abc', creator: userB.id },
    { time: new Date('05/20/20').toISOString(), time_end: new Date('05/20/20').toISOString(), title: 'event', category: 'youtube2', description: 'created by A, joined by B', link: 'https://youtube.com/abc', creator: userA.id },
    { time: new Date('05/21/20').toISOString(), time_end: new Date('05/21/20').toISOString(), title: 'event', category: 'youtube3', description: 'created by B, joined by B', link: 'https://youtube.com/abc', creator: userB.id },
    { time: new Date('05/22/20').toISOString(), time_end: new Date('05/22/20').toISOString(), title: 'event', category: 'youtube3', description: 'created by B, joined by A, joined by B', link: 'https://youtube.com/abc', creator: userB.id }
  ];
    // add one deleted event and check that it is not presented in any of the following responses.
  const {data: {id: deletedEventId}} = await addEvent(eventData[0], authHeader);
  await delEvent(deletedEventId);

  await Promise.all(eventData.map(async data => {
    const {data: {id}} = await addEvent(data, data.creator === userA.id ? authHeader : anotherUserHeader);
    data.id = id;
  }));
  await Promise.all(eventData.map(async data => {
    if (data.description.includes('joined by A'))
      await joinEvent(data.id, authHeader);
    if (data.description.includes('joined by B'))
      await joinEvent(data.id, anotherUserHeader);
  }));
  // check the link in the event data, should be presented iff the event was created by current user or the current user joined an event
  expect(await searchEvent(false, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: eventData.map(data => removeLink(data, ['created by A', 'joined by A'])) }
  });
  // check pagination
  for (let i = 0; i < eventData.length - 1; ++i) {
    expect(await searchEvent(false, false, eventData[0].time, eventData[eventData.length - 1].time, i, 1)).toMatchObject({
      code: 200,
      data: { data: [removeLink(eventData[i], ['created by A', 'joined by A'])], total: eventData.length }
    });
  }
  // check createdByMe
  expect(await searchEvent(true, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.creator === userA.id) }
  });
  // ... with from and to
  expect(await searchEvent(true, false, eventData[2].time, eventData[4].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: [eventData[2], eventData[4]] }
  });
  expect(await searchEvent(true, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10, undefined, anotherUserHeader)).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.creator === userB.id) }
  });
  // ... with category
  expect(await searchEvent(true, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10, 'youtube1')).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.creator === userA.id && data.category === 'youtube1') }
  });

  // check category
  expect(await searchEvent(false, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10, 'youtube1')).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.category === 'youtube1') }
  });

  // check joinedByMe
  expect(await searchEvent(false, true, eventData[0].time, eventData[eventData.length - 1].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.description.includes('joined by A')) }
  });
  // ... with from and to
  expect(await searchEvent(false, true, eventData[0].time, eventData[2].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: [eventData[2]] }
  });
  // ... from and to are included boundaries
  expect(await searchEvent(false, true, eventData[2].time, eventData[2].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: [eventData[2]] }
  });
  expect(await searchEvent(false, true, eventData[0].time, eventData[eventData.length - 1].time, 0, 10, undefined, anotherUserHeader)).toMatchObject({
    code: 200,
    data: { data: eventData.filter(data => data.description.includes('joined by B')) }
  });

  // from > to returns 200 and empty array
  expect(await searchEvent(false, true, eventData[1].time, eventData[0].time, 0, 10, undefined, anotherUserHeader)).toMatchObject({
    code: 200,
    data: { data: [], total: 0 },
  });

  // check joined
  expect(await searchEvent(false, false, eventData[0].time, eventData[eventData.length - 1].time, 0, 10)).toMatchObject({
    code: 200,
    data: { data: eventData.map(data => addJoined(removeLink(data, ['created by A', 'joined by A']))) }
  });

  // bad input
  expect(await searchEvent('str', true, eventData[0].time, eventData[5].time, 0, 10)).toMatchObject({
    code: 400
  });
  expect(await searchEvent(false, 'str', eventData[0].time, eventData[5].time, 0, 10)).toMatchObject({
    code: 400
  });
  expect(await searchEvent(false, true, 'aaa', eventData[5].time, 0, 10)).toMatchObject({
    code: 400
  });
  expect(await searchEvent(false, true, eventData[0].time, 'aaa', 0, 10)).toMatchObject({
    code: 400
  });
  expect(await searchEvent(false, true, eventData[0].time, eventData[5].time, 0, 10, 'a'.repeat(129))).toMatchObject({
    code: 400
  });

  // unauthorized
  expect(await searchEvent(false, true, eventData[0].time, eventData[5].time, 0, 10, undefined, {})).toMatchObject({
    code: 401
  });

  function removeLink(data, descriptionIncludes) {
    const cpy = { ...data };
    for (const description of descriptionIncludes) {
      if (cpy.description.includes(description))
        return cpy;
    }
    delete cpy.link;
    return cpy;
  }

  function addJoined(data) {
    const cpy = { ... data, joined: [] };
    if (cpy.description.includes('joined by A'))
      cpy.joined.push({id: userA.id, fullName: userA.fullName, imagePath: userA.imagePath});
    if (cpy.description.includes('joined by B'))
      cpy.joined.push({id: userB.id, fullName: userB.fullName, imagePath: userB.imagePath});
    return cpy;
  }
});
