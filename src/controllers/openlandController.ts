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

import crypto from 'crypto';

import express from 'express';
import WebSocket from 'ws';

import { getArgs } from '../utils';
const {openlandToken, openlandCodeSecret, enableMethodsForTest} = require('../../config.js');

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

    const prefix = 'Ваш код верификации:\n';
    const success = await client.sendMessage(chatId, prefix + code, [{ type: 'CodeBlock', offset: prefix.length, length: 6 }]);
    client.kill();
    if (!success) {
      client.kill();
      return response.status(500).send({}).end();
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(openlandCodeSecret, 'hex'), iv);
    const {id: userId} = request.user!;
    let encrypted = cipher.update(JSON.stringify({
      code, userId, now: Date.now() + (nextExpirationOverride ? nextExpirationOverride : 120 * 100)
    }));
    nextExpirationOverride = null;
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const codeId = iv.toString('hex') + encrypted.toString('hex');
    response.status(200).send({codeId}).end();
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
  try {
    const {code, codeId}: {code: string, codeId: string} = getArgs(request);
    const iv = Buffer.from(codeId.substr(0, 32), 'hex');
    const data = Buffer.from(codeId.substr(32), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(openlandCodeSecret, 'hex'), iv);
    let decrypted = decipher.update(data);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const {code: target, userId, now} = JSON.parse(decrypted.toString());
    if (userId !== request.user!.id || target !== code || Date.now() > now)
      return response.status(401).send({}).end();
    return response.status(200).send({}).end();
  } catch (e) {
    console.debug('POST /v1/openland/verifyCode', e);
    response.status(500).send({}).end();
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
