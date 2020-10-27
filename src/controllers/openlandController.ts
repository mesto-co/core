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

import express from 'express';
import WebSocket from 'ws';

import { getArgs } from '../utils';
const {openlandToken, enableMethodsForTest} = require('../../config.js');

class OpenlandClient {
  private _ws: WebSocket;
  private _callbacks: Map<string, (data: any) => void>;
  private _connectionReady: (result: boolean) => void = () => void 0;
  private _connectionReadyPromise: Promise<boolean>;
  private _lastId: number = 0;

  constructor() {
    this._ws = new WebSocket('wss://api-us.openland.com/gql_ws');
    this._ws.on('message', this.messageHandler.bind(this));
    this._callbacks = new Map();
    this._connectionReadyPromise = new Promise(resolve => this._connectionReady = (value: boolean) => resolve(value));
    this._ws.once('error', () => this._connectionReady(false));
    this._ws.once('open', () => {
      this._ws.send(JSON.stringify({
        protocol_v: 2,
        type: 'connection_init',
        payload: { 'x-openland-token': openlandToken }
      }));
    });
  }

  waitForReady(timeout: number): Promise<boolean> {
    return Promise.race([
      this._connectionReadyPromise,
      new Promise(resolve => setTimeout(() => resolve(false), timeout)) as Promise<boolean>
    ]);
  }

  private sendQuery(query: string, variables: any): string {
    ++this._lastId;
    const id = String(this._lastId);
    this._ws.send(JSON.stringify({ type: 'start', id, payload: { query, variables } }));
    return id;
  }

  resolveShortName(shortname: string): Promise<string|null> {
    const id = this.sendQuery(
        'query ResolveShortName($shortname: String!) {item: alphaResolveShortName(shortname: $shortname) {... on User { id }}}',
        { shortname }
    );
    return new Promise(resolve => this._callbacks.set(id, response => {
      resolve(response && response.data && response.data.item && response.data.item.id || null);
    }));
  }

  queryRoomChat(userId: string): Promise<string|null> {
    const id = this.sendQuery(
        'query RoomChat($id: ID!) {room(id: $id) {... on PrivateRoom {id}}}',
        { id: userId }
    );
    return new Promise(resolve => this._callbacks.set(id, response => {
      resolve(response && response.data && response.data.room && response.data.room.id || null);
    }));
  }

  sendMessage(chatId: string, message: string, spans: {type: string, offset: number, length: number}[]): Promise<boolean> {
    const id = this.sendQuery(
        'mutation SendMessage($chatId:ID!,$message:String,$spans:[MessageSpanInput!]){sentMessage:sendMessage(chatId:$chatId,message:$message,spans:$spans)}',
        { message, chatId, spans }
    );
    return new Promise(resolve => this._callbacks.set(id, response => {
      resolve(response && response.data && response.data.sentMessage || false);
    }));
  }

  getUser(userId: string): Promise<{id: string, photo: string|null, name: string, website: string | null, about: string | null, location: string | null, linkedin: string | null, instagram: string | null, twitter: string | null, facebook: string | null, shortname: string | null}|null> {
    const id = this.sendQuery(
        'query User($userId:ID!) {user: user(id:$userId) { ... on User {id photo name photo website about location linkedin instagram twitter facebook shortname}}}',
        { userId }
    );
    return new Promise(resolve => this._callbacks.set(id, response => {
      resolve(response && response.data && response.data.user || null);
    }));
  }

  getMessages(chatId: string, first: number): Promise<{date: string, message: string}[]> {
    const id = this.sendQuery(
        'query ChatInitFromUnread($chatId: ID!, $before: ID, $first: Int!) { gammaMessages(chatId: $chatId, first: $first, before: $before) { __typename messages { __typename ...FullMessage }}} fragment FullMessage on ModernMessage {__typename date message }',
        { chatId, first }
    );
    return new Promise(resolve => this._callbacks.set(id, response => {
      resolve(response && response.data && response.data.gammaMessages && response.data.gammaMessages.messages || []);
    }));
  }

  kill() {
    this._ws.close();
  }

  private messageHandler(data: string) {
    try {
      const event = JSON.parse(data);
      if (event.type === 'ping') {
        this._ws.send(JSON.stringify({ type: 'pong' }));
      } else if (event.type === 'connection_ack') {
        this._connectionReady(true);
      } else if (event.type === 'data' && event.id) {
        const callback = this._callbacks.get(event.id);
        if (callback) {
          this._callbacks.delete(event.id);
          callback(event.payload);
        }
      }
    } catch (e) {
      console.debug('OpenlandClient parsing message error: ', e);
      this._ws.close();
    }
  }
}

const MESSAGE_PREFIX = 'Ваш код верификации:\n';

let nextCodeOverride: string|null = null;
let nextExpirationOverride: number|null = null;
const openlandGetCodeRouter = express.Router();
openlandGetCodeRouter.route('/').post(async (request, response) => {
  let client;
  try {
    let {openland}: {openland: string} = getArgs(request);

    const lastSlash = openland.lastIndexOf('/');
    if (lastSlash !== -1)
      openland = openland.substr(lastSlash + 1);
    if (openland.startsWith('@'))
      openland = openland.substr(1);

    client = new OpenlandClient();
    if (!await client.waitForReady(2000)) {
      client.kill();
      return response.status(500).send({}).end();
    }
    const id = await client.resolveShortName(openland);
    if (!id) {
      client.kill();
      return response.status(404).send({}).end();
    }

    const chatId = await client.queryRoomChat(id);
    if (!chatId) {
      client.kill();
      return response.status(404).send({}).end();
    }

    const code = nextCodeOverride || String((Math.random() * 999999) >> 0).padStart(6, '0');
    nextCodeOverride = null;

    const success = await client.sendMessage(chatId, MESSAGE_PREFIX + code, [{ type: 'CodeBlock', offset: MESSAGE_PREFIX.length, length: 6 }]);
    client.kill();
    if (!success) {
      client.kill();
      return response.status(500).send({}).end();
    }
    response.status(200).send({codeId: chatId}).end();
  } catch (e) {
    console.debug('POST /v1/openland/sendCode', e);
    response.status(500).send({}).end();
  } finally {
    if (client)
      client.kill();
  }
});

const openlandVerifyCodeController = express.Router();
openlandVerifyCodeController.route('/').post(async (request, response) => {
  let client;
  try {
    const {code, codeId: chatId}: {code: string, codeId: string} = getArgs(request);
    client = new OpenlandClient();
    if (!await client.waitForReady(2000))
      return response.status(500).send({}).end();
    const [lastMessage] = await client.getMessages(chatId, 1);
    if (!lastMessage)
      return response.status(401).send({}).end();
    if ((Date.now() - parseInt(lastMessage.date, 10)) > (nextExpirationOverride || 120 * 1000))
      return response.status(401).send({}).end();
    if (lastMessage.message.substr(MESSAGE_PREFIX.length) !== code)
      return response.status(401).send({}).end();
    return response.status(200).send({}).end();
  } catch (e) {
    console.debug('POST /v1/openland/verifyCode', e);
    response.status(500).send({}).end();
  } finally {
    if (client)
      client.kill();
  }
});

const openlandGetUserController = express.Router();
openlandGetUserController.route('/').post(async (request, response) => {
  let client;
  try {
    let {openland}: {openland: string} = getArgs(request);

    const lastSlash = openland.lastIndexOf('/');
    if (lastSlash !== -1)
      openland = openland.substr(lastSlash + 1);
    if (openland.startsWith('@'))
      openland = openland.substr(1);

    const client = new OpenlandClient();
    if (!await client.waitForReady(2000)) {
      client.kill();
      return response.status(500).send({}).end();
    }
    const id = await client.resolveShortName(openland);
    if (!id) {
      client.kill();
      return response.status(404).send({}).end();
    }
    const user = await client.getUser(id);
    client.kill();
    if (!user)
      return response.status(404).send({}).end();


    const apiUser: { [key: string]: any } = { fullName: user.name };
    if (user.photo)
      apiUser.imagePath = user.photo;
    if (user.shortname)
      apiUser.username = user.shortname;
    if (user.location)
      apiUser.location = user.location;
    if (user.about)
      apiUser.about = user.about;

    if (user.about) {
      const re = /#m_[^,\s]+/g;
      const about = user.about;
      const skillsFromAbout = [];
      let m = null;
      do {
        m = re.exec(about);
        if (m)
          skillsFromAbout.push(m[0].toLowerCase().substr(3));

      } while (m);
      if (skillsFromAbout.length)
        apiUser.skills = skillsFromAbout;
    }

    const contacts = [{ title: 'openland', url: 'https://openland.com/' + (user.shortname || user.id) }];
    if (user.website)
      contacts.push({ title: 'website', url: user.website });
    if (user.linkedin)
      contacts.push({ title: 'linkedin', url: user.linkedin });
    if (user.instagram)
      contacts.push({ title: 'instagram', url: user.instagram });
    if (user.twitter)
      contacts.push({ title: 'twitter', url: user.twitter });
    if (user.facebook)
      contacts.push({ title: 'facebook', url: user.facebook });
    apiUser.contacts = contacts;
    response.status(200).send({ data: apiUser }).end();
  } catch (e) {
    console.debug('POST /v1/openland/getUser', e);
    response.status(500).send({}).end();
  } finally {
    if (client)
      client.kill();
  }
});

const openlandSetNextCodeForTest = express.Router();
if (enableMethodsForTest) {
  openlandSetNextCodeForTest.route('/').post((request, response) => {
    const {code, expiration} = getArgs(request);
    nextCodeOverride = code;
    if (expiration)
      nextExpirationOverride = expiration;
    response.status(200).send({}).end();
  });
}

export {
  openlandGetCodeRouter as OpenlandGetCodeController,
  openlandGetUserController as OpenlandGetUserController,
  openlandVerifyCodeController as OpenlandVerifyCodeController,
  openlandSetNextCodeForTest as OpenlandSetNextCodeForTest
};
