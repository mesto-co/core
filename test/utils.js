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
const http = require('http');
const https = require('https');
const jsonwebtoken = require('jsonwebtoken');

const debug = require('debug')('fetch');
const {
  accessToken: {
    jwtExpiresIn: accessJwtExpiresIn,
    jwtSecret: accessJwtSecret
  }
} = require('../config.js');

function fetch(url, method, body, header = {'X-Request-Id': 'd5ab3356-f4b4-11ea-adc1-0242ac120002'}) {
  debug('<', url, method, body, header);
  let requestFinished;
  const requestPromise = new Promise(resolve => requestFinished = resolve);
  const req = (url.startsWith('https:') ? https : http).request(url, { method: method, headers: { 'Content-Type': 'application/json', ...header} }, res => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      debug('>', data, res.statusCode);
      requestFinished({data: data ? JSON.parse(data) : {}, code: res.statusCode, headers: res.headers});
    });
  });
  if (body)
    req.write(body);
  req.end();
  return requestPromise;
}

function get(url, header) {
  return fetch(url, 'GET', null, header);
}

function post(url, body, header) {
  return fetch(url, 'POST', body, header);
}

function put(url, body, header) {
  return fetch(url, 'PUT', body, header);
}

function del(url, header) {
  return fetch(url, 'DELETE', null, header);
}

function getHost() {
  return process.env.TEST_API_HOST || 'http://localhost:8080';
}

function getAuthHeader(user, jwtAlgorithm = 'HS256') {
  return {
    Authorization: `Bearer ${jsonwebtoken.sign(user, accessJwtSecret, {expiresIn: accessJwtExpiresIn, algorithm: jwtAlgorithm})}`,
    ['X-Request-Id']: 'd5ab3356-f4b4-11ea-adc1-0242ac120002'
  };
}

module.exports = { get, post, put, del, getHost, getAuthHeader };
