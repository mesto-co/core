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
import {getCompiledTemplate, sendEmailByTemplate} from '../src/emailService';
import { promises as fs } from 'fs';

test('should compile templates', async () => {
  const compiledTemplate = await getCompiledTemplate('test');
  expect(compiledTemplate).toBeDefined();
  const result = compiledTemplate({'name': 'ABC', 'link': 'http://magicLink'});
  expect(result).toEqual(await fs.readFile('./test/data/expectedOutput.html', 'utf8'));
});

// Integration test for AWS SES
if (!!process.env.AWS_ACCESS_KEY_ID && !process.env.CI) {
  test('should send email by template based on passed variables', async () => {
    await sendEmailByTemplate('test', 'sergey@songtive.com', 'тест тема', {
      'name': 'ABC', 'link': 'http://magicLink'
    });
  });
}
