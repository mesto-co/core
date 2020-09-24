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

const {default: app} = require('@mesto/core/app/app.js');

const SOCKET = '/tmp/sock' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) + '.sock';

const server = app.listen(SOCKET);
let pending = [];
server.on('error', error => {
  console.error(error);
  server.close();
});
server.on('listening', () => {
  for (const {requestOptions, resolve} of pending)
    sendRequest(requestOptions).then(resolve);
  pending = [];
});

const INTERNAL_SERVER_ERROR = message => ({
  isBase64Encoded: false,
  statusCode: 500,
  body: JSON.stringify({message})
});

exports.handler = event => {
  if (!event)
    return INTERNAL_SERVER_ERROR('No event object');
  if (event.version !== '2.0')
    return INTERNAL_SERVER_ERROR('Unsupported event version, should be 2.0');

  const requestOptions = {
    socketPath: SOCKET,
    method: event.requestContext && event.requestContext.http && event.requestContext.http.method || 'GET',
    path: (event.rawPath || '/') + (event.rawQueryString ? '?' + event.rawQueryString : ''),
    headers: event.headers
  };
  if (event.body)
    requestOptions.body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

  if (server.listening)
    return sendRequest(requestOptions);
  return new Promise(resolve => pending.push({requestOptions, resolve}));
};

function sendRequest(requestOptions) {
  return new Promise(resolve => {
    const request = http.request(requestOptions, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        resolve({
          isBase64Encoded: true,
          statusCode: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks).toString('base64')
        });
      });
    });
    if (requestOptions.body)
      request.write(requestOptions.body);
    request.end();
  });
}
