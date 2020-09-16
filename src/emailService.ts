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
import magickLinkTemplate from './templates/magickLinkEmail';

const FROM_EMAIL = process.env.SENDER_EMAIL_ADDRESS;

const ses = new SES();

export async function sendMagickLinkEmail(recipient: string, name: string, magickLink: string) {
  const content = magickLinkTemplate(name, magickLink);
  await sendEmail(recipient, 'Линк для входа в mesto.', content);
}

export async function sendEmail(recipient: string, subject: string, content: string) {
  const params: SendEmailRequest = {
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Html: { Data: content },
      },

      Subject: { Data: subject },
    },
    Source: FROM_EMAIL!,
    ReplyToAddresses: [
      FROM_EMAIL!
    ]
  };

  return ses.sendEmail(params).promise();
}
