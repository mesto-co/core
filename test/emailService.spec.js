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
const {sendEmail, sendMagickLinkEmail} = require('../app/emailService');
const config = require('../config.js');

test('should sendMagickLinkEmail', async () => {
  // TODO(desunit): consider using sinon.
  config.emailService.stub = function(recipient, subject, content) {
    expect(recipient).toBe('sergey@songtive.com');
    expect(subject).toBe('Линк для входа в mesto.');
    expect(content).toContain('NAME');
    expect(content).toContain('http://link');
  };
  await sendMagickLinkEmail('sergey@songtive.com', 'NAME', 'http://link');
  config.emailService.stub = null;
});


// Integration test for AWS SES
if (!!process.env.AWS_ACCESS_KEY_ID && !process.env.CI) {
  test('should send email by template based on passed variables', async () => {
    await sendEmail('sergey@songtive.com', 'тест тема', 'тест контент');
  });
}
