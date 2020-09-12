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

import {ValidationError} from './validator';

function errorHandler(err: any, request: express.Request, response: express.Response, next: express.NextFunction) {
  // TODO(ak239spb): we should pass RqUid here as well.
  if (err instanceof SyntaxError)
    return response.status(400).send({ message: err.message });
  if (err instanceof ValidationError)
    return response.status(400).send({ message: err.message });
  if (err instanceof Error)
    return response.status(400).send({ message: err.message });
  next();
}

function notFoundHandler(request: express.Request, response: express.Response, next: express.NextFunction) {
  return response.status(404).send({ message: 'endpoint not found'});
}

export { errorHandler, notFoundHandler };
