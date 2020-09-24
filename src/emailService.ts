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

/*
The module requires the following env variables to be filled:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOURKEY
AWS_SECRET_ACCESS_KEY=YOURSUPERSECRET
SENDER_EMAIL_ADDRESS=email
*/

import { SES } from 'aws-sdk';
import { SendEmailRequest } from 'aws-sdk/clients/ses';
const config = require('../config.js');
import magicLinkTemplate from './templates/magicLinkEmail';

class EmailService {
  FROM_EMAIL = process.env.SENDER_EMAIL_ADDRESS;
  ses = new SES();

  async sendMagicLinkEmail(recipient: string, fullName: string, magicLink: string) {
    const content = magicLinkTemplate(fullName, magicLink);
    const subject = 'Линк для входа в mesto.';
    await this.sendEmail(recipient, subject, content);
  }

  async sendEmail(recipient: string, subject: string, content: string) {
    if (config.emailService.debug) {
      console.log(`Email sent: ${recipient}, subject: ${subject}, body:\n${content}`);
      return;
    }

    const params: SendEmailRequest = {
      Destination: {
        ToAddresses: [recipient],
      },
      Message: {
        Body: {
          Html: {Data: content},
        },

        Subject: {Data: subject},
      },
      Source: this.FROM_EMAIL!,
      ReplyToAddresses: [
        this.FROM_EMAIL!
      ]
    };

    return this.ses.sendEmail(params).promise();
  }
}

const emailService = new EmailService();
export { emailService };
