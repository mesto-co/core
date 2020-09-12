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

import Ajv from 'ajv';
import express from 'express';

import {getArgs} from './utils';

import apiSchemas from './schema/api.json';
import baseSchemas from './schema/base.json';

const ajv = new Ajv({
  useDefaults: true,
  removeAdditional: true,
  coerceTypes: true
}).addSchema(apiSchemas).addSchema(baseSchemas);

class ValidationError extends Error {
    validationError: Ajv.ErrorObject|null;

    constructor(error: Ajv.ErrorObject|null) {
      super(error && error.message || '');
      this.validationError = error;
    }
}

// TODO(ak239spb): we need a way to describe and validate response.
export default (endpoint: string) => {
  return (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const schemaId = `#${request.method}>${endpoint}`;
    if (!ajv.validate(schemaId, getArgs(request)))
      next(new ValidationError(ajv.errors && ajv.errors[0] || null));
    next();
  };
};

export { ValidationError };
