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

function fetch(url, method, body) {
  let requestFinished;
  const requestPromise = new Promise(resolve => requestFinished = resolve);
  const req = http.request(url, { method: 'GET' }, res => {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => requestFinished({data: JSON.parse(data), code: res.statusCode}));
  });
  if (body)
    req.write(body);
  req.end();
  return requestPromise;
}

module.exports = { fetch };
