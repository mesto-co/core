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

const { post, getHost, genUsers, delUsers } = require('../utils.js');

test('POST /v1/admin/(add|del)UsersForTest', async () => {
  const addUrl = `${getHost()}/v1/admin/addUsersForTest`;
  const delUrl = `${getHost()}/v1/admin/delUsersForTest`;
  {
    const {code, data: userIds} = await post(addUrl, JSON.stringify({users: [{location: 'location'}]}));
    expect(code).toBe(200);
    expect(userIds.length).toBe(1);

    const {code: delCode} = await post(delUrl, JSON.stringify({userIds}));
    expect(delCode).toBe(200);
  }
  {
    // genUsers test utility works.
    const ids = await genUsers([{location: 'location'}]);
    expect(ids.length).toBe(1);
    await delUsers(ids);
  }
});
