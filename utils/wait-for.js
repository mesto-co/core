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
const net = require('net');

function ping(host, port, timeout) {
  return new Promise(resolve => {
    const sock = new net.Socket();
    sock.setTimeout(timeout);
    sock.on('connect', function() {
      resolve('connect');
      sock.destroy();
    }).on('error', function(e) {
      resolve('error');
    }).on('timeout', function(e) {
      resolve('timeout');
    }).connect(port, host);
  });
}

(async () => {
  const [,,host] = process.argv;
  let [,,, port, timeout] = process.argv;
  timeout = parseInt(timeout, 10);
  port = parseInt(port, 10);
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), timeout));
  for (;;) {
    const result = await Promise.race([timeoutPromise, ping(host, port, timeout)]);
    if (result === 'connect')
      process.exit(0);
    if (result === 'error')
      continue;
    if (result === 'timeout')
      process.exit(-1);
  }
})();
