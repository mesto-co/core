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

export const HEADER_NAME = 'X-Request-Id';

export default function(request: express.Request, response: express.Response, next: express.NextFunction) {
  const headerValue = request.header(HEADER_NAME);
  if (headerValue)
    response.setHeader(HEADER_NAME, headerValue);
  next();
}
