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

const jsonwebtoken = require('jsonwebtoken');

(async () => {
  const [,,secret, expireIn, id, fullName, ...permissions] = process.argv;
  const payload = {
    id: id,
    fullName: fullName,
    permissions: permissions.map(v => parseInt(v, 10)),
  };
  console.log(jsonwebtoken.sign(payload, Buffer.from(secret, 'base64'), {
    expiresIn: expireIn,
    algorithm: 'HS256'
  }));
})();
