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

const debug = require('debug')('fetch');

function fetch(url, method, body) {
  debug('<', url, method, body);
  let requestFinished;
  const requestPromise = new Promise(resolve => requestFinished = resolve);
  const req = (url.startsWith('https:') ? https : http).request(url, { method: method, headers: { 'Content-Type': 'application/json' } }, res => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      debug('>', data, res.statusCode);
      requestFinished({data: data ? JSON.parse(data) : {}, code: res.statusCode});
    });
  });
  if (body)
    req.write(body);
  req.end();
  return requestPromise;
}

function get(url) {
  return fetch(url, 'GET', null);
}

function post(url, body) {
  return fetch(url, 'POST', body);
}

function put(url, body) {
  return fetch(url, 'PUT', body);
}

function del(url) {
  return fetch(url, 'DELETE', null);
}

function getRqUid() {
  return 'd5ab3356-f4b4-11ea-adc1-0242ac120002';
}

function getHost() {
  return process.env.TEST_API_HOST || 'http://localhost:8080';
}

module.exports = { get, post, put, del, getRqUid, getHost };
