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

function randomString(bytes: number) {
  return new Promise(resolve => {
    crypto.randomBytes(bytes, function(_err, buffer) {
      resolve(buffer.toString('hex'));
    });
  });
}

export async function storePassword(password: string, masterSalt: string) {
  const salt = await randomString(40);
  const digest = crypto.createHash('sha256').update(salt + masterSalt + password).digest('base64');
  return salt + '!' + digest;
}

export async function checkPassword(password: string, masterSalt: string, stored: string) {
  const delimeter = stored.indexOf('!');
  const salt = stored.substr(0, delimeter);
  const digest = stored.substring(delimeter + 1);
  const currentDigest = crypto.createHash('sha256').update(salt + masterSalt + password).digest('base64');
  return currentDigest === digest;
}
