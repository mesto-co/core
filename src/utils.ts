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
import {HEADER_NAME} from './requestId';

const argsSymbol = Symbol('args');
function getArgs(request: express.Request): any {
  if (typeof request === 'object') {
    const requestObject = request as any;
    if (!requestObject[argsSymbol]) {
      const args = Object.assign({}, request.body, request.params, request.query, {[HEADER_NAME]: request.header(HEADER_NAME)});
      // TODO(ak239spb): code below is for compatibility only, remove it as soon as frontend ready for X-Request-Id header
      if (!args[HEADER_NAME])
        args[HEADER_NAME] = args.RqUid || args[HEADER_NAME];

      requestObject[argsSymbol] = args;
    }
    return requestObject[argsSymbol];
  }
  return {};
}

function getEmail(request: express.Request): any {
  const args = getArgs(request);
  const email = args.email;
  if (typeof email === 'string')
    return email.toLowerCase();
  return email;
}

export {getArgs, getEmail};
